-- Orbit CRM — F2.1: Fundação financeira (estimates/invoices/items/payments)

-- ============================================================
-- Configurações financeiras por tenant
-- ============================================================

alter table public.tenants
  add column if not exists currency text not null default 'BRL',
  add column if not exists invoice_prefix text not null default 'INV-',
  add column if not exists estimate_prefix text not null default 'EST-',
  add column if not exists next_invoice_number integer not null default 1,
  add column if not exists next_estimate_number integer not null default 1;

-- ============================================================
-- Faturas
-- ============================================================

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  company_id uuid,
  project_id uuid,
  number integer not null,
  prefix text not null,
  formatted_number text not null,
  status smallint not null default 1 check (status in (1, 2, 3, 5, 6)),
  date date not null default current_date,
  due_date date,
  currency text not null default 'BRL',
  subtotal numeric(15, 2) not null default 0,
  discount_type text not null default 'before_tax'
    check (discount_type in ('before_tax', 'after_tax')),
  discount_percent numeric(5, 2),
  discount_total numeric(15, 2) not null default 0,
  total_tax numeric(15, 2) not null default 0,
  adjustment numeric(15, 2) not null default 0,
  total numeric(15, 2) not null default 0,
  client_note text,
  terms text,
  reference_no text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint invoices_company_fk foreign key (company_id, tenant_id)
    references public.companies (id, tenant_id) on delete cascade,
  constraint invoices_project_fk foreign key (project_id, tenant_id)
    references public.projects (id, tenant_id) on delete cascade
);

create unique index if not exists invoices_id_tenant_key
  on public.invoices (id, tenant_id);
create index if not exists invoices_tenant_idx
  on public.invoices (tenant_id, date desc) where deleted_at is null;

-- ============================================================
-- Orçamentos
-- ============================================================

create table if not exists public.estimates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  company_id uuid,
  project_id uuid,
  number integer not null,
  prefix text not null,
  formatted_number text not null,
  status smallint not null default 1 check (status between 1 and 5),
  date date not null default current_date,
  expiry_date date,
  currency text not null default 'BRL',
  subtotal numeric(15, 2) not null default 0,
  discount_type text not null default 'before_tax'
    check (discount_type in ('before_tax', 'after_tax')),
  discount_percent numeric(5, 2),
  discount_total numeric(15, 2) not null default 0,
  total_tax numeric(15, 2) not null default 0,
  adjustment numeric(15, 2) not null default 0,
  total numeric(15, 2) not null default 0,
  client_note text,
  terms text,
  reference_no text,
  invoice_id uuid,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint estimates_company_fk foreign key (company_id, tenant_id)
    references public.companies (id, tenant_id) on delete cascade,
  constraint estimates_project_fk foreign key (project_id, tenant_id)
    references public.projects (id, tenant_id) on delete cascade,
  constraint estimates_invoice_fk foreign key (invoice_id, tenant_id)
    references public.invoices (id, tenant_id) on delete set null
);

create unique index if not exists estimates_id_tenant_key
  on public.estimates (id, tenant_id);
create index if not exists estimates_tenant_idx
  on public.estimates (tenant_id, date desc) where deleted_at is null;

-- ============================================================
-- Itens de documento (orçamento/fatura)
-- ============================================================

create table if not exists public.document_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  rel_type text not null check (rel_type in ('estimate', 'invoice')),
  rel_id uuid not null,
  description text not null,
  qty numeric(15, 2) not null default 1,
  rate numeric(15, 2) not null default 0,
  unit text,
  tax_name text,
  tax_rate numeric(15, 2),
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists document_items_rel_idx
  on public.document_items (tenant_id, rel_type, rel_id, position);

-- ============================================================
-- Pagamentos
-- ============================================================

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  invoice_id uuid not null,
  amount numeric(15, 2) not null,
  payment_mode text,
  payment_date date not null default current_date,
  transaction_id text,
  note text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint payments_invoice_fk foreign key (invoice_id, tenant_id)
    references public.invoices (id, tenant_id) on delete cascade
);

create index if not exists payments_invoice_idx on public.payments (invoice_id);
create index if not exists payments_tenant_idx on public.payments (tenant_id);

-- ============================================================
-- updated_at
-- ============================================================

drop trigger if exists invoices_set_updated_at on public.invoices;
create trigger invoices_set_updated_at
  before update on public.invoices
  for each row execute function public.set_updated_at();

drop trigger if exists estimates_set_updated_at on public.estimates;
create trigger estimates_set_updated_at
  before update on public.estimates
  for each row execute function public.set_updated_at();

-- ============================================================
-- Numeração por tenant (atômica)
-- ============================================================

create or replace function public.next_document_number(
  p_tenant uuid,
  p_kind text
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v int;
begin
  if not public.is_tenant_member(p_tenant) and not public.is_super_admin() then
    raise exception 'not a member';
  end if;

  if p_kind = 'invoice' then
    update public.tenants set next_invoice_number = next_invoice_number + 1
    where id = p_tenant
    returning next_invoice_number - 1 into v;
  elsif p_kind = 'estimate' then
    update public.tenants set next_estimate_number = next_estimate_number + 1
    where id = p_tenant
    returning next_estimate_number - 1 into v;
  else
    raise exception 'invalid kind %', p_kind;
  end if;

  return v;
end;
$$;

-- ============================================================
-- entity_belongs_to_tenant: agora cobre estimate/invoice
-- ============================================================

create or replace function public.entity_belongs_to_tenant(
  p_entity_type text,
  p_entity_id uuid,
  p_tenant uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case p_entity_type
    when 'task' then exists (
      select 1 from public.tasks t
      where t.id = p_entity_id and t.tenant_id = p_tenant and t.deleted_at is null
    )
    when 'project' then exists (
      select 1 from public.projects pr
      where pr.id = p_entity_id and pr.tenant_id = p_tenant and pr.deleted_at is null
    )
    when 'estimate' then exists (
      select 1 from public.estimates e
      where e.id = p_entity_id and e.tenant_id = p_tenant and e.deleted_at is null
    )
    when 'invoice' then exists (
      select 1 from public.invoices i
      where i.id = p_entity_id and i.tenant_id = p_tenant and i.deleted_at is null
    )
    else false
  end;
$$;

-- ============================================================
-- Grants + RLS
-- ============================================================

grant select, insert, update, delete on public.invoices to authenticated;
grant select, insert, update, delete on public.estimates to authenticated;
grant select, insert, update, delete on public.document_items to authenticated;
grant select, insert, update, delete on public.payments to authenticated;
grant all on public.invoices, public.estimates, public.document_items, public.payments to service_role;
grant all on public.invoices, public.estimates, public.document_items, public.payments to postgres;

alter table public.invoices enable row level security;
alter table public.estimates enable row level security;
alter table public.document_items enable row level security;
alter table public.payments enable row level security;

create policy "invoices_select" on public.invoices
  for select to authenticated using (public.is_tenant_member(tenant_id));
create policy "invoices_insert" on public.invoices
  for insert to authenticated with check (public.is_tenant_member(tenant_id));
create policy "invoices_update" on public.invoices
  for update to authenticated using (public.is_tenant_member(tenant_id))
  with check (public.is_tenant_member(tenant_id));
create policy "invoices_delete" on public.invoices
  for delete to authenticated using (public.is_tenant_member(tenant_id));

create policy "estimates_select" on public.estimates
  for select to authenticated using (public.is_tenant_member(tenant_id));
create policy "estimates_insert" on public.estimates
  for insert to authenticated with check (public.is_tenant_member(tenant_id));
create policy "estimates_update" on public.estimates
  for update to authenticated using (public.is_tenant_member(tenant_id))
  with check (public.is_tenant_member(tenant_id));
create policy "estimates_delete" on public.estimates
  for delete to authenticated using (public.is_tenant_member(tenant_id));

create policy "document_items_select" on public.document_items
  for select to authenticated using (public.is_tenant_member(tenant_id));
create policy "document_items_insert" on public.document_items
  for insert to authenticated
  with check (
    public.is_tenant_member(tenant_id)
    and public.entity_belongs_to_tenant(rel_type, rel_id, tenant_id)
  );
create policy "document_items_update" on public.document_items
  for update to authenticated using (public.is_tenant_member(tenant_id))
  with check (public.is_tenant_member(tenant_id));
create policy "document_items_delete" on public.document_items
  for delete to authenticated using (public.is_tenant_member(tenant_id));

create policy "payments_select" on public.payments
  for select to authenticated using (public.is_tenant_member(tenant_id));
create policy "payments_insert" on public.payments
  for insert to authenticated with check (public.is_tenant_member(tenant_id));
create policy "payments_update" on public.payments
  for update to authenticated using (public.is_tenant_member(tenant_id))
  with check (public.is_tenant_member(tenant_id));
create policy "payments_delete" on public.payments
  for delete to authenticated using (public.is_tenant_member(tenant_id));

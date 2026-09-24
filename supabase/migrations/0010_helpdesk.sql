-- Orbit CRM — F4.1: Help desk (departamentos, tickets, respostas)

alter table public.tenants
  add column if not exists ticket_prefix text not null default 'TCK-',
  add column if not exists next_ticket_number integer not null default 1;

-- numeração por tenant: inclui tickets
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
    where id = p_tenant returning next_invoice_number - 1 into v;
  elsif p_kind = 'estimate' then
    update public.tenants set next_estimate_number = next_estimate_number + 1
    where id = p_tenant returning next_estimate_number - 1 into v;
  elsif p_kind = 'ticket' then
    update public.tenants set next_ticket_number = next_ticket_number + 1
    where id = p_tenant returning next_ticket_number - 1 into v;
  else
    raise exception 'invalid kind %', p_kind;
  end if;

  return v;
end;
$$;

-- ============================================================
-- Departamentos
-- ============================================================

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (tenant_id, name)
);

create index if not exists departments_tenant_idx on public.departments (tenant_id);

-- ============================================================
-- Tickets
-- ============================================================

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  number integer not null,
  formatted_number text not null,
  subject text not null,
  details text,
  status smallint not null default 1 check (status between 1 and 6),
  priority smallint not null default 2 check (priority between 1 and 4),
  type smallint not null default 3 check (type between 1 and 4),
  department_id uuid references public.departments (id) on delete set null,
  company_id uuid,
  contact_id uuid references public.contacts (id) on delete set null,
  assignee_id uuid references public.profiles (id) on delete set null,
  project_id uuid,
  source text not null default 'staff' check (source in ('staff', 'portal', 'email')),
  created_by uuid references public.profiles (id) on delete set null,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint tickets_company_fk foreign key (company_id, tenant_id)
    references public.companies (id, tenant_id) on delete cascade
);

create unique index if not exists tickets_id_tenant_key
  on public.tickets (id, tenant_id);
create index if not exists tickets_tenant_idx
  on public.tickets (tenant_id, created_at desc) where deleted_at is null;
create index if not exists tickets_tenant_status_idx
  on public.tickets (tenant_id, status) where deleted_at is null;

create table if not exists public.ticket_replies (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  ticket_id uuid not null,
  author_id uuid references public.profiles (id) on delete set null,
  contact_id uuid references public.contacts (id) on delete set null,
  body text not null,
  is_internal boolean not null default false,
  created_at timestamptz not null default now(),
  constraint ticket_replies_ticket_fk foreign key (ticket_id, tenant_id)
    references public.tickets (id, tenant_id) on delete cascade
);

create index if not exists ticket_replies_ticket_idx
  on public.ticket_replies (ticket_id, created_at);

-- updated_at
drop trigger if exists tickets_set_updated_at on public.tickets;
create trigger tickets_set_updated_at
  before update on public.tickets
  for each row execute function public.set_updated_at();

-- ============================================================
-- Anexos/comentários: permite entidade 'ticket'
-- ============================================================

alter table public.attachments drop constraint if exists attachments_entity_type_check;
alter table public.attachments add constraint attachments_entity_type_check
  check (entity_type in ('task', 'project', 'ticket'));

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
    when 'ticket' then exists (
      select 1 from public.tickets tk
      where tk.id = p_entity_id and tk.tenant_id = p_tenant and tk.deleted_at is null
    )
    else false
  end;
$$;

-- ============================================================
-- Grants + RLS (staff)
-- ============================================================

grant select, insert, update, delete on public.departments to authenticated;
grant select, insert, update, delete on public.tickets to authenticated;
grant select, insert, update, delete on public.ticket_replies to authenticated;
grant all on public.departments, public.tickets, public.ticket_replies to service_role;
grant all on public.departments, public.tickets, public.ticket_replies to postgres;

alter table public.departments enable row level security;
alter table public.tickets enable row level security;
alter table public.ticket_replies enable row level security;

create policy "departments_select" on public.departments
  for select to authenticated using (public.is_tenant_member(tenant_id));
create policy "departments_insert" on public.departments
  for insert to authenticated with check (public.is_tenant_member(tenant_id));
create policy "departments_update" on public.departments
  for update to authenticated using (public.is_tenant_member(tenant_id))
  with check (public.is_tenant_member(tenant_id));
create policy "departments_delete" on public.departments
  for delete to authenticated using (public.is_tenant_member(tenant_id));

create policy "tickets_select" on public.tickets
  for select to authenticated using (public.is_tenant_member(tenant_id));
create policy "tickets_insert" on public.tickets
  for insert to authenticated with check (public.is_tenant_member(tenant_id));
create policy "tickets_update" on public.tickets
  for update to authenticated using (public.is_tenant_member(tenant_id))
  with check (public.is_tenant_member(tenant_id));
create policy "tickets_delete" on public.tickets
  for delete to authenticated using (public.is_tenant_member(tenant_id));

create policy "ticket_replies_select" on public.ticket_replies
  for select to authenticated using (public.is_tenant_member(tenant_id));
create policy "ticket_replies_insert" on public.ticket_replies
  for insert to authenticated with check (public.is_tenant_member(tenant_id));
create policy "ticket_replies_delete" on public.ticket_replies
  for delete to authenticated using (public.is_tenant_member(tenant_id));

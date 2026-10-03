-- Orbit CRM — F11: Contratos

create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  company_id uuid,
  title text not null,
  description text,
  value numeric(15, 2),
  start_date date,
  end_date date,
  status smallint not null default 1 check (status between 1 and 3),
  note text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint contracts_company_fk foreign key (company_id, tenant_id)
    references public.companies (id, tenant_id) on delete set null (company_id)
);

create unique index if not exists contracts_id_tenant_key
  on public.contracts (id, tenant_id);
create index if not exists contracts_tenant_idx on public.contracts (tenant_id);
create index if not exists contracts_tenant_end_idx
  on public.contracts (tenant_id, end_date) where deleted_at is null;
create index if not exists contracts_company_idx
  on public.contracts (company_id) where deleted_at is null;

drop trigger if exists contracts_set_updated_at on public.contracts;
create trigger contracts_set_updated_at
  before update on public.contracts
  for each row execute function public.set_updated_at();

grant select, insert, update, delete on public.contracts to authenticated;
grant all on public.contracts to service_role;
grant all on public.contracts to postgres;

alter table public.contracts enable row level security;

create policy "contracts_select" on public.contracts
  for select to authenticated using (public.is_tenant_member(tenant_id));
create policy "contracts_insert" on public.contracts
  for insert to authenticated with check (public.is_tenant_member(tenant_id));
create policy "contracts_update" on public.contracts
  for update to authenticated
  using (public.is_tenant_member(tenant_id))
  with check (public.is_tenant_member(tenant_id));
create policy "contracts_delete" on public.contracts
  for delete to authenticated using (public.is_tenant_member(tenant_id));

-- Orbit CRM — F10: Despesas

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  title text not null,
  category text,
  amount numeric(15, 2) not null default 0,
  date date not null default current_date,
  project_id uuid,
  company_id uuid,
  billable boolean not null default false,
  note text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint expenses_project_fk foreign key (project_id, tenant_id)
    references public.projects (id, tenant_id) on delete set null (project_id),
  constraint expenses_company_fk foreign key (company_id, tenant_id)
    references public.companies (id, tenant_id) on delete set null (company_id)
);

create unique index if not exists expenses_id_tenant_key
  on public.expenses (id, tenant_id);
create index if not exists expenses_tenant_idx on public.expenses (tenant_id);
create index if not exists expenses_tenant_date_idx
  on public.expenses (tenant_id, date desc) where deleted_at is null;
create index if not exists expenses_project_idx
  on public.expenses (project_id) where deleted_at is null;
create index if not exists expenses_company_idx
  on public.expenses (company_id) where deleted_at is null;

drop trigger if exists expenses_set_updated_at on public.expenses;
create trigger expenses_set_updated_at
  before update on public.expenses
  for each row execute function public.set_updated_at();

grant select, insert, update, delete on public.expenses to authenticated;
grant all on public.expenses to service_role;
grant all on public.expenses to postgres;

alter table public.expenses enable row level security;

create policy "expenses_select" on public.expenses
  for select to authenticated using (public.is_tenant_member(tenant_id));
create policy "expenses_insert" on public.expenses
  for insert to authenticated with check (public.is_tenant_member(tenant_id));
create policy "expenses_update" on public.expenses
  for update to authenticated
  using (public.is_tenant_member(tenant_id))
  with check (public.is_tenant_member(tenant_id));
create policy "expenses_delete" on public.expenses
  for delete to authenticated using (public.is_tenant_member(tenant_id));

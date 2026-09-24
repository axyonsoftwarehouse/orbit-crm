-- Orbit CRM — F1.1: Clientes (companies) e Contatos (contacts)

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  name text not null,
  vat text,
  phone text,
  website text,
  address text,
  city text,
  state text,
  zip text,
  country text,
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index if not exists companies_id_tenant_key
  on public.companies (id, tenant_id);
create index if not exists companies_tenant_idx on public.companies (tenant_id);
create index if not exists companies_tenant_name_idx
  on public.companies (tenant_id, name) where deleted_at is null;

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  company_id uuid not null,
  first_name text not null,
  last_name text,
  email text,
  phone text,
  title text,
  is_primary boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint contacts_company_fk foreign key (company_id, tenant_id)
    references public.companies (id, tenant_id) on delete cascade
);

create index if not exists contacts_tenant_idx on public.contacts (tenant_id);
create index if not exists contacts_company_idx
  on public.contacts (company_id) where deleted_at is null;

-- updated_at
drop trigger if exists companies_set_updated_at on public.companies;
create trigger companies_set_updated_at
  before update on public.companies
  for each row execute function public.set_updated_at();

drop trigger if exists contacts_set_updated_at on public.contacts;
create trigger contacts_set_updated_at
  before update on public.contacts
  for each row execute function public.set_updated_at();

-- grants
grant select, insert, update, delete on public.companies to authenticated;
grant select, insert, update, delete on public.contacts to authenticated;
grant all on public.companies, public.contacts to service_role;
grant all on public.companies, public.contacts to postgres;

-- RLS
alter table public.companies enable row level security;
alter table public.contacts enable row level security;

create policy "companies_select" on public.companies
  for select to authenticated
  using (public.is_tenant_member(tenant_id));

create policy "companies_insert" on public.companies
  for insert to authenticated
  with check (public.is_tenant_member(tenant_id));

create policy "companies_update" on public.companies
  for update to authenticated
  using (public.is_tenant_member(tenant_id))
  with check (public.is_tenant_member(tenant_id));

create policy "companies_delete" on public.companies
  for delete to authenticated
  using (public.is_tenant_member(tenant_id));

create policy "contacts_select" on public.contacts
  for select to authenticated
  using (public.is_tenant_member(tenant_id));

create policy "contacts_insert" on public.contacts
  for insert to authenticated
  with check (public.is_tenant_member(tenant_id));

create policy "contacts_update" on public.contacts
  for update to authenticated
  using (public.is_tenant_member(tenant_id))
  with check (public.is_tenant_member(tenant_id));

create policy "contacts_delete" on public.contacts
  for delete to authenticated
  using (public.is_tenant_member(tenant_id));

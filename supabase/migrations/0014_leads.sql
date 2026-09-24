-- Orbit CRM — F5.1: CRM comercial (leads, status, origens, atividades)

create table if not exists public.lead_statuses (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  name text not null,
  color text not null default '#92929d',
  position integer not null default 0,
  is_default boolean not null default false,
  is_won boolean not null default false,
  is_lost boolean not null default false,
  created_at timestamptz not null default now(),
  unique (tenant_id, name)
);

create index if not exists lead_statuses_tenant_idx
  on public.lead_statuses (tenant_id, position);

create table if not exists public.lead_sources (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (tenant_id, name)
);

create index if not exists lead_sources_tenant_idx on public.lead_sources (tenant_id);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  name text not null,
  company text,
  title text,
  email text,
  phone text,
  website text,
  description text,
  status_id uuid references public.lead_statuses (id) on delete set null,
  source_id uuid references public.lead_sources (id) on delete set null,
  value numeric(15, 2),
  assignee_id uuid references public.profiles (id) on delete set null,
  city text,
  state text,
  country text,
  lost boolean not null default false,
  converted_company_id uuid,
  converted_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index if not exists leads_id_tenant_key
  on public.leads (id, tenant_id);
create index if not exists leads_tenant_idx
  on public.leads (tenant_id, updated_at desc) where deleted_at is null;
create index if not exists leads_status_idx
  on public.leads (status_id) where deleted_at is null;

create table if not exists public.lead_activities (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  lead_id uuid not null,
  author_id uuid references public.profiles (id) on delete set null,
  description text not null,
  created_at timestamptz not null default now(),
  constraint lead_activities_lead_fk foreign key (lead_id, tenant_id)
    references public.leads (id, tenant_id) on delete cascade
);

create index if not exists lead_activities_lead_idx
  on public.lead_activities (lead_id, created_at);

-- updated_at
drop trigger if exists leads_set_updated_at on public.leads;
create trigger leads_set_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();

-- grants
grant select, insert, update, delete on public.lead_statuses to authenticated;
grant select, insert, update, delete on public.lead_sources to authenticated;
grant select, insert, update, delete on public.leads to authenticated;
grant select, insert, update, delete on public.lead_activities to authenticated;
grant all on public.lead_statuses, public.lead_sources, public.leads, public.lead_activities to service_role;
grant all on public.lead_statuses, public.lead_sources, public.leads, public.lead_activities to postgres;

-- RLS (interno)
alter table public.lead_statuses enable row level security;
alter table public.lead_sources enable row level security;
alter table public.leads enable row level security;
alter table public.lead_activities enable row level security;

drop policy if exists "lead_statuses_staff" on public.lead_statuses;
create policy "lead_statuses_staff" on public.lead_statuses
  for all to authenticated
  using (public.is_tenant_member(tenant_id))
  with check (public.is_tenant_member(tenant_id));

drop policy if exists "lead_sources_staff" on public.lead_sources;
create policy "lead_sources_staff" on public.lead_sources
  for all to authenticated
  using (public.is_tenant_member(tenant_id))
  with check (public.is_tenant_member(tenant_id));

drop policy if exists "leads_staff" on public.leads;
create policy "leads_staff" on public.leads
  for all to authenticated
  using (public.is_tenant_member(tenant_id))
  with check (public.is_tenant_member(tenant_id));

drop policy if exists "lead_activities_staff" on public.lead_activities;
create policy "lead_activities_staff" on public.lead_activities
  for all to authenticated
  using (public.is_tenant_member(tenant_id))
  with check (public.is_tenant_member(tenant_id));

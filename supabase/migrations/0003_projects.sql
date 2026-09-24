-- Orbit CRM — F1.2: Projetos (projects + project_members)

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  company_id uuid,
  name text not null,
  description text,
  status smallint not null default 1 check (status between 1 and 5),
  billing_type smallint not null default 1 check (billing_type between 1 and 3),
  start_date date,
  deadline date,
  date_finished timestamptz,
  progress smallint not null default 0 check (progress between 0 and 100),
  progress_from_tasks boolean not null default false,
  project_cost numeric(15, 2),
  rate_per_hour numeric(15, 2),
  estimated_hours numeric(10, 2),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint projects_company_fk foreign key (company_id, tenant_id)
    references public.companies (id, tenant_id) on delete cascade
);

create unique index if not exists projects_id_tenant_key
  on public.projects (id, tenant_id);
create index if not exists projects_tenant_idx on public.projects (tenant_id);
create index if not exists projects_tenant_status_idx
  on public.projects (tenant_id, status) where deleted_at is null;
create index if not exists projects_company_idx
  on public.projects (company_id) where deleted_at is null;

create table if not exists public.project_members (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  project_id uuid not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (project_id, user_id),
  constraint project_members_project_fk foreign key (project_id, tenant_id)
    references public.projects (id, tenant_id) on delete cascade
);

create index if not exists project_members_tenant_idx
  on public.project_members (tenant_id);
create index if not exists project_members_project_idx
  on public.project_members (project_id);

-- updated_at
drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

-- grants
grant select, insert, update, delete on public.projects to authenticated;
grant select, insert, update, delete on public.project_members to authenticated;
grant all on public.projects, public.project_members to service_role;
grant all on public.projects, public.project_members to postgres;

-- RLS
alter table public.projects enable row level security;
alter table public.project_members enable row level security;

create policy "projects_select" on public.projects
  for select to authenticated
  using (public.is_tenant_member(tenant_id));

create policy "projects_insert" on public.projects
  for insert to authenticated
  with check (public.is_tenant_member(tenant_id));

create policy "projects_update" on public.projects
  for update to authenticated
  using (public.is_tenant_member(tenant_id))
  with check (public.is_tenant_member(tenant_id));

create policy "projects_delete" on public.projects
  for delete to authenticated
  using (public.is_tenant_member(tenant_id));

create policy "project_members_select" on public.project_members
  for select to authenticated
  using (public.is_tenant_member(tenant_id));

create policy "project_members_insert" on public.project_members
  for insert to authenticated
  with check (public.is_tenant_member(tenant_id));

create policy "project_members_delete" on public.project_members
  for delete to authenticated
  using (public.is_tenant_member(tenant_id));

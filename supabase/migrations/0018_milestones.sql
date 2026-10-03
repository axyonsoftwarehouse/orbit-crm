-- Orbit CRM — F7.1: Marcos do projeto (milestones + tasks.milestone_id)

create table if not exists public.milestones (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  project_id uuid not null,
  name text not null,
  description text,
  status smallint not null default 1 check (status between 1 and 3),
  color text not null default '#0062FF',
  start_date date,
  due_date date,
  date_finished timestamptz,
  position integer not null default 0,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint milestones_project_fk foreign key (project_id, tenant_id)
    references public.projects (id, tenant_id) on delete cascade
);

create unique index if not exists milestones_id_tenant_key
  on public.milestones (id, tenant_id);
create unique index if not exists milestones_id_project_tenant_key
  on public.milestones (id, project_id, tenant_id);
create index if not exists milestones_tenant_idx on public.milestones (tenant_id);
create index if not exists milestones_project_idx
  on public.milestones (project_id) where deleted_at is null;
create index if not exists milestones_project_position_idx
  on public.milestones (project_id, position) where deleted_at is null;

-- Vínculo opcional da tarefa a um marco do mesmo projeto/tenant
alter table public.tasks add column if not exists milestone_id uuid;

create index if not exists tasks_milestone_idx
  on public.tasks (milestone_id) where deleted_at is null;

alter table public.tasks drop constraint if exists tasks_milestone_fk;
alter table public.tasks
  add constraint tasks_milestone_fk
  foreign key (milestone_id, project_id, tenant_id)
  references public.milestones (id, project_id, tenant_id)
  on delete set null (milestone_id);

-- updated_at
drop trigger if exists milestones_set_updated_at on public.milestones;
create trigger milestones_set_updated_at
  before update on public.milestones
  for each row execute function public.set_updated_at();

-- grants
grant select, insert, update, delete on public.milestones to authenticated;
grant all on public.milestones to service_role;
grant all on public.milestones to postgres;

-- RLS
alter table public.milestones enable row level security;

create policy "milestones_select" on public.milestones
  for select to authenticated
  using (public.is_tenant_member(tenant_id));

create policy "milestones_insert" on public.milestones
  for insert to authenticated
  with check (public.is_tenant_member(tenant_id));

create policy "milestones_update" on public.milestones
  for update to authenticated
  using (public.is_tenant_member(tenant_id))
  with check (public.is_tenant_member(tenant_id));

create policy "milestones_delete" on public.milestones
  for delete to authenticated
  using (public.is_tenant_member(tenant_id));

-- Leitura pelo cliente no portal (F7.3): marcos de projetos visíveis
create policy "milestones_client_select" on public.milestones
  for select to authenticated
  using (deleted_at is null and public.client_can_view_project(project_id));

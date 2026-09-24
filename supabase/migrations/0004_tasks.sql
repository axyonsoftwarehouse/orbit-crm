-- Orbit CRM — F1.3: Tarefas (tasks + task_checklist_items)

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  project_id uuid not null,
  name text not null,
  description text,
  status smallint not null default 1 check (status between 1 and 5),
  priority smallint not null default 2 check (priority between 1 and 4),
  start_date date,
  due_date date,
  date_finished timestamptz,
  assignee_id uuid references public.profiles (id) on delete set null,
  billable boolean not null default false,
  hourly_rate numeric(15, 2),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint tasks_project_fk foreign key (project_id, tenant_id)
    references public.projects (id, tenant_id) on delete cascade
);

create unique index if not exists tasks_id_tenant_key
  on public.tasks (id, tenant_id);
create index if not exists tasks_tenant_idx on public.tasks (tenant_id);
create index if not exists tasks_project_idx
  on public.tasks (project_id) where deleted_at is null;
create index if not exists tasks_assignee_idx
  on public.tasks (assignee_id) where deleted_at is null;
create index if not exists tasks_tenant_status_idx
  on public.tasks (tenant_id, status) where deleted_at is null;

create table if not exists public.task_checklist_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  task_id uuid not null,
  title text not null,
  is_done boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  constraint task_checklist_task_fk foreign key (task_id, tenant_id)
    references public.tasks (id, tenant_id) on delete cascade
);

create index if not exists task_checklist_tenant_idx
  on public.task_checklist_items (tenant_id);
create index if not exists task_checklist_task_idx
  on public.task_checklist_items (task_id);

-- updated_at
drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- grants
grant select, insert, update, delete on public.tasks to authenticated;
grant select, insert, update, delete on public.task_checklist_items to authenticated;
grant all on public.tasks, public.task_checklist_items to service_role;
grant all on public.tasks, public.task_checklist_items to postgres;

-- RLS
alter table public.tasks enable row level security;
alter table public.task_checklist_items enable row level security;

create policy "tasks_select" on public.tasks
  for select to authenticated
  using (public.is_tenant_member(tenant_id));

create policy "tasks_insert" on public.tasks
  for insert to authenticated
  with check (public.is_tenant_member(tenant_id));

create policy "tasks_update" on public.tasks
  for update to authenticated
  using (public.is_tenant_member(tenant_id))
  with check (public.is_tenant_member(tenant_id));

create policy "tasks_delete" on public.tasks
  for delete to authenticated
  using (public.is_tenant_member(tenant_id));

create policy "task_checklist_select" on public.task_checklist_items
  for select to authenticated
  using (public.is_tenant_member(tenant_id));

create policy "task_checklist_insert" on public.task_checklist_items
  for insert to authenticated
  with check (public.is_tenant_member(tenant_id));

create policy "task_checklist_update" on public.task_checklist_items
  for update to authenticated
  using (public.is_tenant_member(tenant_id))
  with check (public.is_tenant_member(tenant_id));

create policy "task_checklist_delete" on public.task_checklist_items
  for delete to authenticated
  using (public.is_tenant_member(tenant_id));

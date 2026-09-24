-- Orbit CRM — F1.5: Timesheet (time_entries)

create table if not exists public.time_entries (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  project_id uuid not null,
  task_id uuid,
  user_id uuid not null references public.profiles (id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds integer,
  is_billable boolean not null default false,
  rate numeric(15, 2),
  billed boolean not null default false,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint time_entries_project_fk foreign key (project_id, tenant_id)
    references public.projects (id, tenant_id) on delete cascade,
  constraint time_entries_task_fk foreign key (task_id, tenant_id)
    references public.tasks (id, tenant_id) on delete cascade
);

-- Um único timer em execução por usuário (ended_at IS NULL).
create unique index if not exists time_entries_running_idx
  on public.time_entries (tenant_id, user_id) where ended_at is null;

create index if not exists time_entries_tenant_idx
  on public.time_entries (tenant_id, started_at desc);
create index if not exists time_entries_project_idx
  on public.time_entries (project_id);
create index if not exists time_entries_task_idx on public.time_entries (task_id);
create index if not exists time_entries_user_idx on public.time_entries (user_id);

-- updated_at
drop trigger if exists time_entries_set_updated_at on public.time_entries;
create trigger time_entries_set_updated_at
  before update on public.time_entries
  for each row execute function public.set_updated_at();

-- grants
grant select, insert, update, delete on public.time_entries to authenticated;
grant all on public.time_entries to service_role;
grant all on public.time_entries to postgres;

-- RLS
alter table public.time_entries enable row level security;

create policy "time_entries_select" on public.time_entries
  for select to authenticated
  using (public.is_tenant_member(tenant_id));

create policy "time_entries_insert" on public.time_entries
  for insert to authenticated
  with check (public.is_tenant_member(tenant_id));

create policy "time_entries_update" on public.time_entries
  for update to authenticated
  using (public.is_tenant_member(tenant_id))
  with check (public.is_tenant_member(tenant_id));

create policy "time_entries_delete" on public.time_entries
  for delete to authenticated
  using (public.is_tenant_member(tenant_id));

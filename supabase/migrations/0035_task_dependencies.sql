-- Orbit CRM — F19: Dependências entre tarefas (Gantt interativo)

create table if not exists public.task_dependencies (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  task_id uuid not null,
  depends_on_task_id uuid not null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint task_dependencies_task_fk foreign key (task_id, tenant_id)
    references public.tasks (id, tenant_id) on delete cascade,
  constraint task_dependencies_dep_fk foreign key (depends_on_task_id, tenant_id)
    references public.tasks (id, tenant_id) on delete cascade,
  constraint task_dependencies_no_self check (task_id <> depends_on_task_id),
  constraint task_dependencies_unique
    unique (tenant_id, task_id, depends_on_task_id)
);

create index if not exists task_dependencies_tenant_idx
  on public.task_dependencies (tenant_id);
create index if not exists task_dependencies_task_idx
  on public.task_dependencies (task_id);
create index if not exists task_dependencies_dep_idx
  on public.task_dependencies (depends_on_task_id);

grant select, insert, update, delete on public.task_dependencies to authenticated;
grant all on public.task_dependencies to service_role;
grant all on public.task_dependencies to postgres;

alter table public.task_dependencies enable row level security;

create policy "task_dependencies_select" on public.task_dependencies
  for select to authenticated using (public.is_tenant_member(tenant_id));
create policy "task_dependencies_insert" on public.task_dependencies
  for insert to authenticated with check (public.is_tenant_member(tenant_id));
create policy "task_dependencies_update" on public.task_dependencies
  for update to authenticated
  using (public.is_tenant_member(tenant_id))
  with check (public.is_tenant_member(tenant_id));
create policy "task_dependencies_delete" on public.task_dependencies
  for delete to authenticated using (public.is_tenant_member(tenant_id));

-- Orbit CRM — F12: Calendário (eventos próprios)

create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  title text not null,
  description text,
  start_at timestamptz not null,
  end_at timestamptz,
  company_id uuid,
  project_id uuid,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint calendar_events_company_fk foreign key (company_id, tenant_id)
    references public.companies (id, tenant_id) on delete set null (company_id),
  constraint calendar_events_project_fk foreign key (project_id, tenant_id)
    references public.projects (id, tenant_id) on delete set null (project_id)
);

create unique index if not exists calendar_events_id_tenant_key
  on public.calendar_events (id, tenant_id);
create index if not exists calendar_events_tenant_idx
  on public.calendar_events (tenant_id);
create index if not exists calendar_events_tenant_start_idx
  on public.calendar_events (tenant_id, start_at) where deleted_at is null;

drop trigger if exists calendar_events_set_updated_at on public.calendar_events;
create trigger calendar_events_set_updated_at
  before update on public.calendar_events
  for each row execute function public.set_updated_at();

grant select, insert, update, delete on public.calendar_events to authenticated;
grant all on public.calendar_events to service_role;
grant all on public.calendar_events to postgres;

alter table public.calendar_events enable row level security;

create policy "calendar_events_select" on public.calendar_events
  for select to authenticated using (public.is_tenant_member(tenant_id));
create policy "calendar_events_insert" on public.calendar_events
  for insert to authenticated with check (public.is_tenant_member(tenant_id));
create policy "calendar_events_update" on public.calendar_events
  for update to authenticated
  using (public.is_tenant_member(tenant_id))
  with check (public.is_tenant_member(tenant_id));
create policy "calendar_events_delete" on public.calendar_events
  for delete to authenticated using (public.is_tenant_member(tenant_id));

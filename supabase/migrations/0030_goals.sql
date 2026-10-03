-- Orbit CRM — F14: Metas (goals)

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  title text,
  metric text not null default 'revenue'
    check (metric in ('revenue', 'leads', 'hours')),
  period_start date not null,
  period_end date not null,
  target numeric(15, 2) not null default 0,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint goals_period_check check (period_end >= period_start)
);

create unique index if not exists goals_id_tenant_key
  on public.goals (id, tenant_id);
create index if not exists goals_tenant_idx on public.goals (tenant_id);
create index if not exists goals_tenant_period_idx
  on public.goals (tenant_id, period_start) where deleted_at is null;

drop trigger if exists goals_set_updated_at on public.goals;
create trigger goals_set_updated_at
  before update on public.goals
  for each row execute function public.set_updated_at();

grant select, insert, update, delete on public.goals to authenticated;
grant all on public.goals to service_role;
grant all on public.goals to postgres;

alter table public.goals enable row level security;

create policy "goals_select" on public.goals
  for select to authenticated using (public.is_tenant_member(tenant_id));
create policy "goals_insert" on public.goals
  for insert to authenticated with check (public.is_tenant_member(tenant_id));
create policy "goals_update" on public.goals
  for update to authenticated
  using (public.is_tenant_member(tenant_id))
  with check (public.is_tenant_member(tenant_id));
create policy "goals_delete" on public.goals
  for delete to authenticated using (public.is_tenant_member(tenant_id));

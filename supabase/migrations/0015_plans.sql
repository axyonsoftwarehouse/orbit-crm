-- Orbit CRM — F6.1: Planos e limites

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(15, 2) not null default 0,
  interval text not null default 'monthly' check (interval in ('monthly', 'yearly')),
  trial_days integer not null default 0,
  most_popular boolean not null default false,
  is_active boolean not null default true,
  limits jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tenants
  add column if not exists plan_id uuid,
  add column if not exists plan_status text not null default 'active'
    check (plan_status in ('active', 'trial', 'suspended')),
  add column if not exists trial_ends_at timestamptz,
  add column if not exists subscription_ends_at timestamptz;

alter table public.tenants drop constraint if exists tenants_plan_fk;
alter table public.tenants
  add constraint tenants_plan_fk foreign key (plan_id)
  references public.plans (id) on delete set null;

drop trigger if exists plans_set_updated_at on public.plans;
create trigger plans_set_updated_at
  before update on public.plans
  for each row execute function public.set_updated_at();

grant select, insert, update, delete on public.plans to authenticated;
grant all on public.plans to service_role;
grant all on public.plans to postgres;

alter table public.plans enable row level security;

drop policy if exists "plans_select" on public.plans;
create policy "plans_select" on public.plans
  for select to authenticated using (true);

drop policy if exists "plans_insert" on public.plans;
create policy "plans_insert" on public.plans
  for insert to authenticated with check (public.is_super_admin());

drop policy if exists "plans_update" on public.plans;
create policy "plans_update" on public.plans
  for update to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

drop policy if exists "plans_delete" on public.plans;
create policy "plans_delete" on public.plans
  for delete to authenticated using (public.is_super_admin());

-- Planos padrão (apenas se a tabela estiver vazia)
insert into public.plans (name, description, price, interval, trial_days, most_popular, limits)
select * from (
  values
    ('Starter', 'Para começar', 99.00, 'monthly', 7, false,
      '{"clients":20,"projects":10,"tasks":200,"tickets":50,"leads":100}'::jsonb),
    ('Pro', 'Para times em crescimento', 249.00, 'monthly', 14, true,
      '{"clients":100,"projects":50,"tasks":1000,"tickets":300,"leads":1000}'::jsonb),
    ('Business', 'Sem limites', 499.00, 'monthly', 14, false,
      '{"clients":null,"projects":null,"tasks":null,"tickets":null,"leads":null}'::jsonb)
) as t(name, description, price, interval, trial_days, most_popular, limits)
where not exists (select 1 from public.plans);

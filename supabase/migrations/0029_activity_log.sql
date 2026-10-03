-- Orbit CRM — F13: Log de auditoria (trilha de atividades)

create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  entity text not null,
  entity_id uuid,
  action text not null check (action in ('insert', 'update', 'delete')),
  created_at timestamptz not null default now()
);

create index if not exists activity_log_tenant_idx
  on public.activity_log (tenant_id, created_at desc);
create index if not exists activity_log_entity_idx
  on public.activity_log (tenant_id, entity, created_at desc);
create index if not exists activity_log_actor_idx
  on public.activity_log (actor_id);

-- Somente leitura para membros; a escrita é feita pelo trigger (security definer).
grant select on public.activity_log to authenticated;
grant all on public.activity_log to service_role;
grant all on public.activity_log to postgres;

alter table public.activity_log enable row level security;

create policy "activity_log_select" on public.activity_log
  for select to authenticated
  using (public.is_tenant_member(tenant_id) or public.is_super_admin());

-- Função genérica de auditoria
create or replace function public.log_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant uuid;
  v_entity_id uuid;
begin
  if tg_op = 'DELETE' then
    v_tenant := old.tenant_id;
    v_entity_id := old.id;
  else
    v_tenant := new.tenant_id;
    v_entity_id := new.id;
  end if;

  insert into public.activity_log (tenant_id, actor_id, entity, entity_id, action)
  values (v_tenant, auth.uid(), tg_table_name, v_entity_id, lower(tg_op));

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

-- Anexa a auditoria às principais tabelas de negócio
do $$
declare
  t text;
  tables text[] := array[
    'companies',
    'contacts',
    'projects',
    'tasks',
    'invoices',
    'payments',
    'estimates',
    'expenses',
    'contracts',
    'leads',
    'tickets'
  ];
begin
  foreach t in array tables
  loop
    execute format(
      'drop trigger if exists %I on public.%I',
      t || '_activity',
      t
    );
    execute format(
      'create trigger %I after insert or update or delete on public.%I for each row execute function public.log_activity()',
      t || '_activity',
      t
    );
  end loop;
end $$;

-- Orbit CRM — F8.2: Campos personalizados
-- Definições por tenant/entidade + valores por registro (armazenamento texto).

create table if not exists public.custom_field_definitions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  entity_type text not null
    check (entity_type in ('company', 'project', 'task', 'lead')),
  label text not null,
  key text not null,
  field_type text not null
    check (field_type in ('text', 'textarea', 'number', 'date', 'select', 'checkbox')),
  required boolean not null default false,
  position integer not null default 0,
  options jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, entity_type, key)
);

create unique index if not exists custom_field_definitions_id_tenant_key
  on public.custom_field_definitions (id, tenant_id);
create index if not exists custom_field_definitions_tenant_idx
  on public.custom_field_definitions (tenant_id, entity_type, position);

create table if not exists public.custom_field_values (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  field_id uuid not null,
  entity_type text not null
    check (entity_type in ('company', 'project', 'task', 'lead')),
  entity_id uuid not null,
  value text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (field_id, entity_type, entity_id),
  constraint custom_field_values_field_fk foreign key (field_id, tenant_id)
    references public.custom_field_definitions (id, tenant_id) on delete cascade
);

create index if not exists custom_field_values_entity_idx
  on public.custom_field_values (tenant_id, entity_type, entity_id);

drop trigger if exists custom_field_definitions_set_updated_at
  on public.custom_field_definitions;
create trigger custom_field_definitions_set_updated_at
  before update on public.custom_field_definitions
  for each row execute function public.set_updated_at();

drop trigger if exists custom_field_values_set_updated_at
  on public.custom_field_values;
create trigger custom_field_values_set_updated_at
  before update on public.custom_field_values
  for each row execute function public.set_updated_at();

-- grants
grant select, insert, update, delete on public.custom_field_definitions to authenticated;
grant select, insert, update, delete on public.custom_field_values to authenticated;
grant all on public.custom_field_definitions to service_role;
grant all on public.custom_field_definitions to postgres;
grant all on public.custom_field_values to service_role;
grant all on public.custom_field_values to postgres;

-- RLS
alter table public.custom_field_definitions enable row level security;
alter table public.custom_field_values enable row level security;

create policy "custom_field_definitions_select" on public.custom_field_definitions
  for select to authenticated using (public.is_tenant_member(tenant_id));
create policy "custom_field_definitions_insert" on public.custom_field_definitions
  for insert to authenticated with check (public.is_tenant_member(tenant_id));
create policy "custom_field_definitions_update" on public.custom_field_definitions
  for update to authenticated
  using (public.is_tenant_member(tenant_id))
  with check (public.is_tenant_member(tenant_id));
create policy "custom_field_definitions_delete" on public.custom_field_definitions
  for delete to authenticated using (public.is_tenant_member(tenant_id));

create policy "custom_field_values_select" on public.custom_field_values
  for select to authenticated using (public.is_tenant_member(tenant_id));
create policy "custom_field_values_insert" on public.custom_field_values
  for insert to authenticated
  with check (
    public.is_tenant_member(tenant_id)
    and public.entity_belongs_to_tenant(entity_type, entity_id, tenant_id)
  );
create policy "custom_field_values_update" on public.custom_field_values
  for update to authenticated
  using (public.is_tenant_member(tenant_id))
  with check (
    public.is_tenant_member(tenant_id)
    and public.entity_belongs_to_tenant(entity_type, entity_id, tenant_id)
  );
create policy "custom_field_values_delete" on public.custom_field_values
  for delete to authenticated using (public.is_tenant_member(tenant_id));

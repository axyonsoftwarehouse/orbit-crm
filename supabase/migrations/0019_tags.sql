-- Orbit CRM — F8.1: Tags (tags + taggables)

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  name text not null,
  color text not null default '#0062FF',
  created_at timestamptz not null default now()
);

create unique index if not exists tags_id_tenant_key
  on public.tags (id, tenant_id);
create unique index if not exists tags_tenant_name_key
  on public.tags (tenant_id, lower(name));
create index if not exists tags_tenant_idx on public.tags (tenant_id);

create table if not exists public.taggables (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  tag_id uuid not null,
  entity_type text not null
    check (entity_type in ('company', 'project', 'task', 'lead', 'ticket')),
  entity_id uuid not null,
  created_at timestamptz not null default now(),
  unique (tag_id, entity_type, entity_id),
  constraint taggables_tag_fk foreign key (tag_id, tenant_id)
    references public.tags (id, tenant_id) on delete cascade
);

create index if not exists taggables_tenant_idx on public.taggables (tenant_id);
create index if not exists taggables_entity_idx
  on public.taggables (tenant_id, entity_type, entity_id);
create index if not exists taggables_tag_idx on public.taggables (tag_id);

-- ============================================================
-- entity_belongs_to_tenant: incluir company e lead
-- ============================================================

create or replace function public.entity_belongs_to_tenant(
  p_entity_type text,
  p_entity_id uuid,
  p_tenant uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case p_entity_type
    when 'task' then exists (
      select 1 from public.tasks t
      where t.id = p_entity_id and t.tenant_id = p_tenant and t.deleted_at is null
    )
    when 'project' then exists (
      select 1 from public.projects pr
      where pr.id = p_entity_id and pr.tenant_id = p_tenant and pr.deleted_at is null
    )
    when 'estimate' then exists (
      select 1 from public.estimates e
      where e.id = p_entity_id and e.tenant_id = p_tenant and e.deleted_at is null
    )
    when 'invoice' then exists (
      select 1 from public.invoices i
      where i.id = p_entity_id and i.tenant_id = p_tenant and i.deleted_at is null
    )
    when 'ticket' then exists (
      select 1 from public.tickets tk
      where tk.id = p_entity_id and tk.tenant_id = p_tenant and tk.deleted_at is null
    )
    when 'company' then exists (
      select 1 from public.companies c
      where c.id = p_entity_id and c.tenant_id = p_tenant and c.deleted_at is null
    )
    when 'lead' then exists (
      select 1 from public.leads l
      where l.id = p_entity_id and l.tenant_id = p_tenant and l.deleted_at is null
    )
    else false
  end;
$$;

-- ============================================================
-- Grants + RLS (staff)
-- ============================================================

grant select, insert, update, delete on public.tags to authenticated;
grant select, insert, update, delete on public.taggables to authenticated;
grant all on public.tags, public.taggables to service_role;
grant all on public.tags, public.taggables to postgres;

alter table public.tags enable row level security;
alter table public.taggables enable row level security;

create policy "tags_select" on public.tags
  for select to authenticated using (public.is_tenant_member(tenant_id));
create policy "tags_insert" on public.tags
  for insert to authenticated with check (public.is_tenant_member(tenant_id));
create policy "tags_update" on public.tags
  for update to authenticated
  using (public.is_tenant_member(tenant_id))
  with check (public.is_tenant_member(tenant_id));
create policy "tags_delete" on public.tags
  for delete to authenticated using (public.is_tenant_member(tenant_id));

create policy "taggables_select" on public.taggables
  for select to authenticated using (public.is_tenant_member(tenant_id));
create policy "taggables_insert" on public.taggables
  for insert to authenticated
  with check (
    public.is_tenant_member(tenant_id)
    and public.entity_belongs_to_tenant(entity_type, entity_id, tenant_id)
  );
create policy "taggables_delete" on public.taggables
  for delete to authenticated using (public.is_tenant_member(tenant_id));

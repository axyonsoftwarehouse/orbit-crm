-- Catálogo de itens e serviços (paridade Perfex 3.4.1)
-- Ver docs/perfex/catalogo-de-itens.md e docs/superpowers/specs/2026-11-22-catalogo-de-itens-design.md

create table public.item_groups (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, name),
  unique (id, tenant_id)
);

create table public.items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  group_id uuid,
  description text not null,
  long_description text,
  rate numeric(15, 2) not null default 0 check (rate >= 0),
  purchase_price numeric(15, 2) check (purchase_price >= 0),
  unit text,
  tax_name text,
  tax_rate numeric(15, 2) check (tax_rate >= 0 and tax_rate <= 100),
  active boolean not null default true,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  -- impede grupo de outro tenant; null não é checado (MATCH SIMPLE)
  foreign key (group_id, tenant_id)
    references public.item_groups (id, tenant_id) on delete restrict
);

create index items_tenant_description_idx
  on public.items (tenant_id, description) where deleted_at is null;
create index items_group_idx on public.items (tenant_id, group_id);

alter table public.document_items
  add column if not exists item_id uuid references public.items (id) on delete set null;

alter table public.item_groups enable row level security;
alter table public.items enable row level security;

create policy "item_groups_select" on public.item_groups
  for select to authenticated using (public.is_tenant_member(tenant_id));
create policy "item_groups_insert" on public.item_groups
  for insert to authenticated with check (public.is_tenant_member(tenant_id));
create policy "item_groups_update" on public.item_groups
  for update to authenticated using (public.is_tenant_member(tenant_id))
  with check (public.is_tenant_member(tenant_id));
create policy "item_groups_delete" on public.item_groups
  for delete to authenticated
  using (public.has_tenant_role(tenant_id, array['owner', 'admin']));

create policy "items_select" on public.items
  for select to authenticated using (public.is_tenant_member(tenant_id));
create policy "items_insert" on public.items
  for insert to authenticated with check (public.is_tenant_member(tenant_id));
create policy "items_update" on public.items
  for update to authenticated using (public.is_tenant_member(tenant_id))
  with check (public.is_tenant_member(tenant_id));
create policy "items_delete" on public.items
  for delete to authenticated
  using (public.has_tenant_role(tenant_id, array['owner', 'admin']));

drop trigger if exists items_protect_soft_delete on public.items;
create trigger items_protect_soft_delete
  before update on public.items
  for each row execute function public.protect_soft_delete();

-- item_id não pode apontar para item de outro tenant
drop policy if exists "document_items_insert" on public.document_items;
create policy "document_items_insert" on public.document_items
  for insert to authenticated
  with check (
    public.is_tenant_member(tenant_id)
    and public.entity_belongs_to_tenant(rel_type, rel_id, tenant_id)
    and (
      item_id is null
      or exists (
        select 1 from public.items i
        where i.id = item_id and i.tenant_id = document_items.tenant_id
      )
    )
  );

drop policy if exists "document_items_update" on public.document_items;
create policy "document_items_update" on public.document_items
  for update to authenticated using (public.is_tenant_member(tenant_id))
  with check (
    public.is_tenant_member(tenant_id)
    and (
      item_id is null
      or exists (
        select 1 from public.items i
        where i.id = item_id and i.tenant_id = document_items.tenant_id
      )
    )
  );

-- Orbit CRM — F1.4: Comentários e Anexos (polimórficos) + Storage

-- ============================================================
-- Funções auxiliares
-- ============================================================

-- Verifica se a entidade (task/project) pertence ao tenant.
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
    else false
  end;
$$;

-- Extrai o tenant_id (primeiro segmento) de um caminho no Storage.
create or replace function public.storage_path_tenant(p_name text)
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  parts text[];
begin
  parts := storage.foldername(p_name);
  if parts is null or array_length(parts, 1) is null then
    return null;
  end if;
  return parts[1]::uuid;
exception when others then
  return null;
end;
$$;

-- ============================================================
-- Tabelas
-- ============================================================

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  entity_type text not null check (entity_type in ('task', 'project')),
  entity_id uuid not null,
  author_id uuid references public.profiles (id) on delete set null,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists comments_entity_idx
  on public.comments (tenant_id, entity_type, entity_id, created_at);

create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  entity_type text not null check (entity_type in ('task', 'project')),
  entity_id uuid not null,
  storage_path text not null,
  file_name text not null,
  mime_type text,
  size_bytes bigint,
  uploaded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists attachments_entity_idx
  on public.attachments (tenant_id, entity_type, entity_id, created_at);

-- grants
grant select, insert, update, delete on public.comments to authenticated;
grant select, insert, update, delete on public.attachments to authenticated;
grant all on public.comments, public.attachments to service_role;
grant all on public.comments, public.attachments to postgres;

-- RLS
alter table public.comments enable row level security;
alter table public.attachments enable row level security;

create policy "comments_select" on public.comments
  for select to authenticated
  using (public.is_tenant_member(tenant_id));

create policy "comments_insert" on public.comments
  for insert to authenticated
  with check (
    public.is_tenant_member(tenant_id)
    and public.entity_belongs_to_tenant(entity_type, entity_id, tenant_id)
  );

create policy "comments_delete" on public.comments
  for delete to authenticated
  using (public.is_tenant_member(tenant_id));

create policy "attachments_select" on public.attachments
  for select to authenticated
  using (public.is_tenant_member(tenant_id));

create policy "attachments_insert" on public.attachments
  for insert to authenticated
  with check (
    public.is_tenant_member(tenant_id)
    and public.entity_belongs_to_tenant(entity_type, entity_id, tenant_id)
  );

create policy "attachments_delete" on public.attachments
  for delete to authenticated
  using (public.is_tenant_member(tenant_id));

-- ============================================================
-- Storage: bucket privado + policies por tenant
-- ============================================================

insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

create policy "attachments_obj_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'attachments'
    and public.is_tenant_member(public.storage_path_tenant(name))
  );

create policy "attachments_obj_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'attachments'
    and public.is_tenant_member(public.storage_path_tenant(name))
  );

create policy "attachments_obj_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'attachments'
    and public.is_tenant_member(public.storage_path_tenant(name))
  );

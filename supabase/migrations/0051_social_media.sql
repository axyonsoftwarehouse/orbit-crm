-- Orbit CRM — Social: biblioteca de mídia por post

create table if not exists public.social_media (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  post_id uuid not null,
  storage_path text not null,
  file_name text not null,
  mime_type text,
  size_bytes bigint,
  alt_text text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint social_media_post_fk foreign key (post_id, tenant_id)
    references public.social_posts (id, tenant_id) on delete cascade
);

create unique index if not exists social_media_storage_path_key
  on public.social_media (tenant_id, storage_path);
create index if not exists social_media_post_idx
  on public.social_media (post_id, created_at);

grant select, insert, update, delete on public.social_media to authenticated;
grant all on public.social_media to service_role, postgres;

alter table public.social_media enable row level security;

create policy "social_media_select" on public.social_media
  for select to authenticated using (public.is_tenant_member(tenant_id));
create policy "social_media_insert" on public.social_media
  for insert to authenticated
  with check (
    public.is_tenant_member(tenant_id)
    and public.storage_path_tenant(storage_path) = tenant_id
  );
create policy "social_media_delete" on public.social_media
  for delete to authenticated using (public.is_tenant_member(tenant_id));

insert into storage.buckets (id, name, public)
values ('social_media', 'social_media', false)
on conflict (id) do nothing;

create policy "social_media_obj_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'social_media'
    and public.is_tenant_member(public.storage_path_tenant(name))
  );

create policy "social_media_obj_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'social_media'
    and public.is_tenant_member(public.storage_path_tenant(name))
  );

create policy "social_media_obj_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'social_media'
    and public.is_tenant_member(public.storage_path_tenant(name))
  );

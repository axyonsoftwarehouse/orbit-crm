-- Orbit CRM — Branding: bucket público para logos por tenant

insert into storage.buckets (id, name, public)
values ('branding', 'branding', true)
on conflict (id) do nothing;

-- Leitura pública (bucket público)
create policy "branding_obj_select" on storage.objects
  for select to public
  using (bucket_id = 'branding');

-- Escrita restrita ao tenant dono do prefixo
create policy "branding_obj_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'branding'
    and public.is_tenant_member(public.storage_path_tenant(name))
  );

create policy "branding_obj_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'branding'
    and public.is_tenant_member(public.storage_path_tenant(name))
  )
  with check (
    bucket_id = 'branding'
    and public.is_tenant_member(public.storage_path_tenant(name))
  );

create policy "branding_obj_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'branding'
    and public.is_tenant_member(public.storage_path_tenant(name))
  );

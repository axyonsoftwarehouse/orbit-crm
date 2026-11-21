-- Orbit CRM — bucket privado das assinaturas de contrato
--
-- O PNG da assinatura fica em `contracts/<tenant>/contracts/<contrato>/...`.
-- Leitura pública acontece só no servidor (service role + URL assinada curta),
-- por isso o bucket é privado e não há policy para `anon`.

insert into storage.buckets (id, name, public)
values ('contracts', 'contracts', false)
on conflict (id) do nothing;

create policy "contracts_obj_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'contracts'
    and public.is_tenant_member(public.storage_path_tenant(name))
  );

create policy "contracts_obj_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'contracts'
    and public.is_tenant_member(public.storage_path_tenant(name))
  );

create policy "contracts_obj_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'contracts'
    and public.is_tenant_member(public.storage_path_tenant(name))
  );

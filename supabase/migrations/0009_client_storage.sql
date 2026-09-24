-- Orbit CRM — F3.2: leitura de anexos pelo cliente no Storage

create policy "attachments_obj_client_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'attachments'
    and exists (
      select 1 from public.contacts c
      where c.user_id = auth.uid()
        and c.tenant_id = public.storage_path_tenant(name)
    )
  );

-- Orbit CRM — F4.3: leitura de categorias de KB pelo cliente
create policy "kb_categories_client_select" on public.kb_categories
  for select to authenticated
  using (
    exists (
      select 1 from public.contacts c
      where c.user_id = auth.uid() and c.tenant_id = kb_categories.tenant_id
    )
  );

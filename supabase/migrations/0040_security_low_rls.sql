-- Orbit CRM — hardening de segurança (baixo, parte 2: RLS)

-- ============================================================
-- 1) Policies de leitura do portal respeitam soft-delete
-- ============================================================
drop policy if exists "contracts_client_select" on public.contracts;
create policy "contracts_client_select" on public.contracts
  for select to authenticated
  using (deleted_at is null and public.is_client_of_company(company_id));

drop policy if exists "expenses_client_select" on public.expenses;
create policy "expenses_client_select" on public.expenses
  for select to authenticated
  using (
    billable
    and deleted_at is null
    and public.is_client_of_company(company_id)
  );

drop policy if exists "profiles_client_select" on public.profiles;
create policy "profiles_client_select" on public.profiles
  for select to authenticated
  using (
    exists (
      select 1
      from public.project_members pm
      join public.projects p on p.id = pm.project_id
      join public.contacts c on c.company_id = p.company_id
      where pm.user_id = profiles.id
        and c.user_id = auth.uid()
        and p.deleted_at is null
        and c.deleted_at is null
    )
  );

-- ============================================================
-- 2) notifications_update não pode mover para outro tenant
-- ============================================================
drop policy if exists "notifications_update" on public.notifications;
create policy "notifications_update" on public.notifications
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and public.is_tenant_member(tenant_id));

-- ============================================================
-- 3) email_log_insert restrito a owner/admin do tenant
-- ============================================================
drop policy if exists "email_log_insert" on public.email_log;
create policy "email_log_insert" on public.email_log
  for insert to authenticated
  with check (public.has_tenant_role(tenant_id, array['owner', 'admin']));

-- ============================================================
-- 4) document_items_update valida o dono da entidade referenciada
-- ============================================================
drop policy if exists "document_items_update" on public.document_items;
create policy "document_items_update" on public.document_items
  for update to authenticated
  using (public.is_tenant_member(tenant_id))
  with check (
    public.is_tenant_member(tenant_id)
    and public.entity_belongs_to_tenant(rel_type, rel_id, tenant_id)
  );

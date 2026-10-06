-- Orbit CRM — hardening de segurança (alto)

-- ============================================================
-- 1) Papel owner: só um owner concede/revoga (admin não mexe em owner)
-- ============================================================
drop policy if exists "memberships_update" on public.memberships;
create policy "memberships_update" on public.memberships
  for update to authenticated
  using (
    public.is_super_admin()
    or public.has_tenant_role(tenant_id, array['owner'])
    or (public.has_tenant_role(tenant_id, array['admin']) and role <> 'owner')
  )
  with check (
    public.is_super_admin()
    or public.has_tenant_role(tenant_id, array['owner'])
    or (public.has_tenant_role(tenant_id, array['admin']) and role <> 'owner')
  );

drop policy if exists "memberships_delete" on public.memberships;
create policy "memberships_delete" on public.memberships
  for delete to authenticated
  using (
    public.is_super_admin()
    or public.has_tenant_role(tenant_id, array['owner'])
    or (public.has_tenant_role(tenant_id, array['admin']) and role <> 'owner')
  );

-- ============================================================
-- 2) Portal do cliente: só lê anexos de entidades que pode ver
-- ============================================================
create or replace function public.client_can_view_attachment_path(p_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.attachments a
    where a.storage_path = p_name
      and public.client_can_view_entity(a.entity_type, a.entity_id)
  );
$$;

drop policy if exists "attachments_obj_client_select" on storage.objects;
create policy "attachments_obj_client_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'attachments'
    and public.client_can_view_attachment_path(name)
  );

-- ============================================================
-- 3) Status/plano do tenant: somente a plataforma (super-admin) altera
-- ============================================================
create or replace function public.protect_tenant_platform_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_super_admin() then
    if new.status is distinct from old.status
      or new.plan_id is distinct from old.plan_id
      or new.plan_status is distinct from old.plan_status
      or new.trial_ends_at is distinct from old.trial_ends_at
      or new.subscription_ends_at is distinct from old.subscription_ends_at
    then
      raise exception 'status/plano do tenant são gerenciados pela plataforma';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists tenants_protect_platform_columns on public.tenants;
create trigger tenants_protect_platform_columns
  before update on public.tenants
  for each row execute function public.protect_tenant_platform_columns();

-- ============================================================
-- 4) Lançamento de horas: só o dono ou owner/admin apaga
-- ============================================================
drop policy if exists "time_entries_delete" on public.time_entries;
create policy "time_entries_delete" on public.time_entries
  for delete to authenticated
  using (
    user_id = auth.uid()
    or public.has_tenant_role(tenant_id, array['owner', 'admin'])
    or public.is_super_admin()
  );

-- Orbit CRM — hardening de segurança (P0)
-- Corrige achados da revisão:
--   (1) leitura cross-tenant de anexos via storage_path forjado;
--   (2) escalonamento admin -> owner em memberships/invitations;
--   (3) contato do portal vinculado a auth.users por qualquer membro;
--   (4) rascunhos (estimate/invoice) visíveis no portal.

-- ============================================================
-- 1) Anexos: o storage_path tem que pertencer ao tenant da linha
-- ============================================================
drop policy if exists "attachments_insert" on public.attachments;
create policy "attachments_insert" on public.attachments
  for insert to authenticated
  with check (
    public.is_tenant_member(tenant_id)
    and public.entity_belongs_to_tenant(entity_type, entity_id, tenant_id)
    and public.storage_path_tenant(storage_path) = tenant_id
  );

-- Defesa em profundidade: mesmo com uma linha legada apontando para o caminho
-- de outro tenant, o cliente só assina objetos cujo prefixo seja do tenant da
-- própria linha de anexo.
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
      and public.storage_path_tenant(a.storage_path) = a.tenant_id
      and public.client_can_view_entity(a.entity_type, a.entity_id)
  );
$$;

-- ============================================================
-- 2) memberships/invitations: só owner concede o papel owner
--    (admin continua podendo convidar/atribuir member/admin)
-- ============================================================
drop policy if exists "memberships_insert" on public.memberships;
create policy "memberships_insert" on public.memberships
  for insert to authenticated
  with check (
    public.is_super_admin()
    or public.has_tenant_role(tenant_id, array['owner'])
    or (
      role <> 'owner'
      and public.has_tenant_role(tenant_id, array['admin'])
    )
  );

drop policy if exists "invitations_insert" on public.invitations;
create policy "invitations_insert" on public.invitations
  for insert to authenticated
  with check (
    public.is_super_admin()
    or public.has_tenant_role(tenant_id, array['owner'])
    or (
      role <> 'owner'
      and public.has_tenant_role(tenant_id, array['admin'])
    )
  );

-- ============================================================
-- 3) contacts.user_id: só owner/admin (super-admin) altera o vínculo
--    do contato com o usuário de portal.
-- ============================================================
create or replace function public.protect_contact_user_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.user_id is distinct from old.user_id then
    if auth.uid() is not null
      and not public.is_super_admin()
      and not public.has_tenant_role(new.tenant_id, array['owner', 'admin'])
    then
      raise exception
        'user_id do contato só pode ser alterado por owner/admin';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists contacts_protect_user_id on public.contacts;
create trigger contacts_protect_user_id
  before update on public.contacts
  for each row execute function public.protect_contact_user_id();

-- Mantém o padrão do hardening: não expor a função ao papel anon
-- (CREATE FUNCTION concede EXECUTE a PUBLIC por padrão).
revoke execute on function public.protect_contact_user_id() from public, anon;
grant execute on function public.protect_contact_user_id()
  to authenticated, service_role;

-- ============================================================
-- 4) Portal: rascunhos de orçamento/fatura não são visíveis
--    (estimate status 1 = Rascunho; invoice status 6 = Rascunho)
-- ============================================================
create or replace function public.client_can_view_document(
  p_rel_type text,
  p_rel_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case p_rel_type
    when 'estimate' then exists (
      select 1 from public.estimates e
      join public.contacts c on c.company_id = e.company_id
      where e.id = p_rel_id and c.user_id = auth.uid()
        and c.deleted_at is null and e.deleted_at is null
        and e.status <> 1
    )
    when 'invoice' then exists (
      select 1 from public.invoices i
      join public.contacts c on c.company_id = i.company_id
      where i.id = p_rel_id and c.user_id = auth.uid()
        and c.deleted_at is null and i.deleted_at is null
        and i.status <> 6
    )
    else false
  end;
$$;

drop policy if exists "estimates_client_select" on public.estimates;
create policy "estimates_client_select" on public.estimates
  for select to authenticated
  using (
    deleted_at is null
    and status <> 1
    and public.is_client_of_company(company_id)
  );

drop policy if exists "invoices_client_select" on public.invoices;
create policy "invoices_client_select" on public.invoices
  for select to authenticated
  using (
    deleted_at is null
    and status <> 6
    and public.is_client_of_company(company_id)
  );

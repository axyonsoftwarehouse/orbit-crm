-- Orbit CRM — F3.1: Portal do cliente (acesso por contato + RLS de leitura)

-- Vínculo do contato com um usuário de auth (portal)
alter table public.contacts
  add column if not exists user_id uuid references auth.users (id) on delete set null;

create unique index if not exists contacts_user_id_key
  on public.contacts (user_id) where user_id is not null;

-- ============================================================
-- Funções auxiliares de acesso do cliente
-- ============================================================

create or replace function public.is_client_of_company(p_company uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.contacts c
    where c.user_id = auth.uid() and c.company_id = p_company and c.deleted_at is null
  );
$$;

create or replace function public.client_can_view_project(p_project uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.projects p
    join public.contacts c on c.company_id = p.company_id
    where p.id = p_project
      and c.user_id = auth.uid()
      and c.deleted_at is null
      and p.deleted_at is null
  );
$$;

create or replace function public.client_can_view_document(p_rel_type text, p_rel_id uuid)
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
    )
    when 'invoice' then exists (
      select 1 from public.invoices i
      join public.contacts c on c.company_id = i.company_id
      where i.id = p_rel_id and c.user_id = auth.uid()
        and c.deleted_at is null and i.deleted_at is null
    )
    else false
  end;
$$;

create or replace function public.client_can_view_entity(p_entity_type text, p_entity_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case p_entity_type
    when 'project' then public.client_can_view_project(p_entity_id)
    when 'task' then exists (
      select 1 from public.tasks t
      where t.id = p_entity_id and t.deleted_at is null
        and public.client_can_view_project(t.project_id)
    )
    else false
  end;
$$;

-- ============================================================
-- Políticas de leitura para o cliente
-- ============================================================

create policy "contacts_client_select" on public.contacts
  for select to authenticated using (user_id = auth.uid());

create policy "companies_client_select" on public.companies
  for select to authenticated using (public.is_client_of_company(id));

create policy "tenants_client_select" on public.tenants
  for select to authenticated using (
    exists (
      select 1 from public.contacts c
      where c.user_id = auth.uid() and c.tenant_id = tenants.id
    )
  );

create policy "projects_client_select" on public.projects
  for select to authenticated using (public.is_client_of_company(company_id));

create policy "tasks_client_select" on public.tasks
  for select to authenticated using (public.client_can_view_project(project_id));

create policy "estimates_client_select" on public.estimates
  for select to authenticated using (public.is_client_of_company(company_id));

create policy "invoices_client_select" on public.invoices
  for select to authenticated using (public.is_client_of_company(company_id));

create policy "document_items_client_select" on public.document_items
  for select to authenticated
  using (public.client_can_view_document(rel_type, rel_id));

create policy "payments_client_select" on public.payments
  for select to authenticated
  using (public.client_can_view_document('invoice', invoice_id));

create policy "comments_client_select" on public.comments
  for select to authenticated
  using (public.client_can_view_entity(entity_type, entity_id));

create policy "attachments_client_select" on public.attachments
  for select to authenticated
  using (public.client_can_view_entity(entity_type, entity_id));

create policy "profiles_client_select" on public.profiles
  for select to authenticated
  using (
    exists (
      select 1
      from public.project_members pm
      join public.projects p on p.id = pm.project_id
      join public.contacts c on c.company_id = p.company_id
      where pm.user_id = profiles.id and c.user_id = auth.uid()
    )
  );

-- ============================================================
-- Aprovação de orçamento pelo cliente (via RPC segura)
-- ============================================================

create or replace function public.client_respond_estimate(
  p_estimate uuid,
  p_accept boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.client_can_view_document('estimate', p_estimate) then
    raise exception 'not allowed';
  end if;

  update public.estimates
    set status = case when p_accept then 4 else 3 end
    where id = p_estimate;
end;
$$;

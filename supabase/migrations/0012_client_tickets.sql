-- Orbit CRM — F4.3: Help desk no portal do cliente

-- Numeração de ticket também permitida para clientes do tenant
create or replace function public.next_document_number(
  p_tenant uuid,
  p_kind text
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v int;
begin
  if not (
    public.is_tenant_member(p_tenant)
    or public.is_super_admin()
    or (
      p_kind = 'ticket'
      and exists (
        select 1 from public.contacts c
        where c.user_id = auth.uid()
          and c.tenant_id = p_tenant
          and c.deleted_at is null
      )
    )
  ) then
    raise exception 'not allowed';
  end if;

  if p_kind = 'invoice' then
    update public.tenants set next_invoice_number = next_invoice_number + 1
    where id = p_tenant returning next_invoice_number - 1 into v;
  elsif p_kind = 'estimate' then
    update public.tenants set next_estimate_number = next_estimate_number + 1
    where id = p_tenant returning next_estimate_number - 1 into v;
  elsif p_kind = 'ticket' then
    update public.tenants set next_ticket_number = next_ticket_number + 1
    where id = p_tenant returning next_ticket_number - 1 into v;
  else
    raise exception 'invalid kind %', p_kind;
  end if;

  return v;
end;
$$;

-- Cliente pode ver o ticket da sua empresa/contato
create or replace function public.client_can_view_ticket(p_ticket uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tickets t
    join public.contacts c on c.user_id = auth.uid()
    where t.id = p_ticket
      and t.deleted_at is null
      and c.deleted_at is null
      and (c.company_id = t.company_id or c.id = t.contact_id)
  );
$$;

-- entity_belongs_to_tenant / client_can_view_entity: incluir ticket
create or replace function public.client_can_view_entity(
  p_entity_type text,
  p_entity_id uuid
)
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
    when 'ticket' then public.client_can_view_ticket(p_entity_id)
    else false
  end;
$$;

-- ============================================================
-- Policies de cliente para tickets/respostas
-- ============================================================

create policy "tickets_client_select" on public.tickets
  for select to authenticated
  using (
    deleted_at is null
    and exists (
      select 1 from public.contacts c
      where c.user_id = auth.uid()
        and c.deleted_at is null
        and (c.company_id = tickets.company_id or c.id = tickets.contact_id)
    )
  );

create policy "tickets_client_insert" on public.tickets
  for insert to authenticated
  with check (
    source = 'portal'
    and exists (
      select 1 from public.contacts c
      where c.user_id = auth.uid()
        and c.deleted_at is null
        and c.tenant_id = tickets.tenant_id
        and c.company_id = tickets.company_id
        and c.id = tickets.contact_id
    )
  );

create policy "ticket_replies_client_select" on public.ticket_replies
  for select to authenticated
  using (is_internal = false and public.client_can_view_ticket(ticket_id));

create policy "ticket_replies_client_insert" on public.ticket_replies
  for insert to authenticated
  with check (
    is_internal = false
    and author_id is null
    and public.client_can_view_ticket(ticket_id)
    and exists (
      select 1 from public.contacts c
      where c.user_id = auth.uid()
        and c.deleted_at is null
        and c.id = ticket_replies.contact_id
    )
  );

-- Cliente pode ler departamentos do seu tenant
create policy "departments_client_select" on public.departments
  for select to authenticated
  using (
    exists (
      select 1 from public.contacts c
      where c.user_id = auth.uid() and c.tenant_id = departments.tenant_id
    )
  );

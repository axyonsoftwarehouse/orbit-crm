-- Orbit CRM — hardening de segurança (médio)

-- ============================================================
-- 1) Notificação só pode ser criada para o próprio usuário
--    (o job de lembretes usa service_role e continua liberado)
-- ============================================================
drop policy if exists "notifications_insert" on public.notifications;
create policy "notifications_insert" on public.notifications
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and public.is_tenant_member(tenant_id)
  );

-- ============================================================
-- 2) Isolamento do ticket no portal por tenant
--    (contact_id não tem FK composta; exige mesmo tenant)
-- ============================================================
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
      and c.tenant_id = t.tenant_id
      and (c.company_id = t.company_id or c.id = t.contact_id)
  );
$$;

drop policy if exists "tickets_client_select" on public.tickets;
create policy "tickets_client_select" on public.tickets
  for select to authenticated
  using (
    deleted_at is null
    and exists (
      select 1 from public.contacts c
      where c.user_id = auth.uid()
        and c.deleted_at is null
        and c.tenant_id = tickets.tenant_id
        and (c.company_id = tickets.company_id or c.id = tickets.contact_id)
    )
  );

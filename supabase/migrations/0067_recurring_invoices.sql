-- Orbit CRM — #50: Fatura recorrente (mensalidades)
--
-- Uma fatura com `recurrence_interval_months` é o modelo de uma série. O cron
-- diário (service role) gera as próximas faturas, que apontam para o modelo
-- em `recurrence_parent_id` e são numeradas na série por `recurrence_sequence`
-- (o índice único impede duplicar uma mesma ocorrência).

alter table public.invoices
  add column if not exists recurrence_interval_months smallint
    check (recurrence_interval_months in (1, 3, 12)),
  add column if not exists recurrence_end_date date,
  add column if not exists recurrence_auto_send boolean not null default false,
  add column if not exists recurrence_parent_id uuid,
  add column if not exists recurrence_sequence integer
    check (recurrence_sequence is null or recurrence_sequence > 0);

alter table public.invoices
  drop constraint if exists invoices_recurrence_parent_fk;
alter table public.invoices
  add constraint invoices_recurrence_parent_fk
    foreign key (recurrence_parent_id, tenant_id)
    references public.invoices (id, tenant_id)
    on delete set null (recurrence_parent_id);

-- Uma fatura gerada não é modelo de outra série.
alter table public.invoices
  drop constraint if exists invoices_recurrence_child_not_template;
alter table public.invoices
  add constraint invoices_recurrence_child_not_template
    check (recurrence_parent_id is null or recurrence_interval_months is null);

create unique index if not exists invoices_recurrence_occurrence_key
  on public.invoices (recurrence_parent_id, recurrence_sequence)
  where recurrence_parent_id is not null;

create index if not exists invoices_recurrence_templates_idx
  on public.invoices (tenant_id)
  where recurrence_interval_months is not null and deleted_at is null;

-- Numeração: o cron (service role, sem auth.uid()) também pode numerar.
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
    or coalesce(auth.role(), '') = 'service_role'
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

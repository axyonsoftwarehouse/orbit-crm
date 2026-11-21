-- Orbit CRM — portal: status de assinatura nos contratos
--
-- A função devolve colunas novas, então precisa ser recriada (o Postgres não
-- muda o tipo de retorno com `create or replace`). Continua sem expor `note`,
-- `content` nem a prova de aceite.

drop function if exists public.portal_list_contracts(uuid);

create function public.portal_list_contracts(p_company uuid)
returns table (
  id uuid,
  title text,
  description text,
  value numeric,
  start_date date,
  end_date date,
  status smallint,
  signed_at timestamptz,
  marked_as_signed_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id, c.title, c.description, c.value,
    c.start_date, c.end_date, c.status,
    c.signed_at, c.marked_as_signed_at
  from public.contracts c
  where c.company_id = p_company
    and c.deleted_at is null
    and public.is_client_of_company(p_company)
  order by c.created_at desc;
$$;

revoke execute on function public.portal_list_contracts(uuid) from public, anon;
grant execute on function public.portal_list_contracts(uuid)
  to authenticated, service_role;

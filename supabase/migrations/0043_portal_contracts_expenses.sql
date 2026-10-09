-- Orbit CRM — portal: contratos e despesas via RPC (fecha coluna `note`)
-- Mesmo racional da 0042: o cliente do portal compartilha o papel
-- `authenticated` com o staff, então a leitura direta das tabelas expõe todas
-- as colunas (inclusive `note`, interna). Passa a ler via funções SECURITY
-- DEFINER que projetam apenas colunas seguras, e remove as policies de leitura
-- direta.

-- ============================================================
-- 1) Contratos visíveis ao cliente (sem `note`)
-- ============================================================
create or replace function public.portal_list_contracts(p_company uuid)
returns table (
  id uuid,
  title text,
  description text,
  value numeric,
  start_date date,
  end_date date,
  status smallint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id, c.title, c.description, c.value,
    c.start_date, c.end_date, c.status
  from public.contracts c
  where c.company_id = p_company
    and c.deleted_at is null
    and public.is_client_of_company(p_company)
  order by c.created_at desc;
$$;

-- ============================================================
-- 2) Despesas faturáveis visíveis ao cliente (sem `note`)
-- ============================================================
create or replace function public.portal_list_expenses(p_company uuid)
returns table (
  id uuid,
  title text,
  category text,
  amount numeric,
  date date,
  project_id uuid,
  project_name text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    e.id, e.title, e.category, e.amount, e.date,
    e.project_id, p.name as project_name
  from public.expenses e
  left join public.projects p on p.id = e.project_id
  where e.company_id = p_company
    and e.billable
    and e.deleted_at is null
    and public.is_client_of_company(p_company)
  order by e.date desc;
$$;

-- ============================================================
-- 3) Grants (não expor ao anon)
-- ============================================================
revoke execute on function public.portal_list_contracts(uuid) from public, anon;
revoke execute on function public.portal_list_expenses(uuid) from public, anon;

grant execute on function public.portal_list_contracts(uuid)
  to authenticated, service_role;
grant execute on function public.portal_list_expenses(uuid)
  to authenticated, service_role;

-- ============================================================
-- 4) Remove a leitura direta do cliente
-- ============================================================
drop policy if exists "contracts_client_select" on public.contracts;
drop policy if exists "expenses_client_select" on public.expenses;

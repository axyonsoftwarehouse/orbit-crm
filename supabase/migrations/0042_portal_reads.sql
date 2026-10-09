-- Orbit CRM — portal: leitura via RPC (fecha vazamento de colunas internas)
-- RLS não filtra colunas e o cliente do portal compartilha o papel
-- `authenticated` com o staff. Para não expor colunas internas
-- (projects.project_cost/rate_per_hour/estimated_hours, tasks.hourly_rate/
-- billable/assignee_id, companies.notes, profiles.is_super_admin/notify_email)
-- via PostgREST direto, as leituras do portal passam a usar funções
-- SECURITY DEFINER que projetam apenas colunas seguras, e as policies de
-- leitura direta dessas tabelas são removidas.

-- ============================================================
-- 1) Contato do portal (contato + empresa + tenant)
-- ============================================================
create or replace function public.portal_contact()
returns table (
  id uuid,
  first_name text,
  last_name text,
  email text,
  company_id uuid,
  company_name text,
  tenant_id uuid,
  tenant_name text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id,
    c.first_name,
    c.last_name,
    c.email,
    c.company_id,
    coalesce(co.name, 'Empresa') as company_name,
    c.tenant_id,
    coalesce(t.name, 'Portal') as tenant_name
  from public.contacts c
  left join public.companies co on co.id = c.company_id
  left join public.tenants t on t.id = c.tenant_id
  where c.user_id = auth.uid() and c.deleted_at is null
  order by c.created_at asc
  limit 1;
$$;

-- ============================================================
-- 2) Projetos visíveis ao cliente (sem colunas financeiras internas)
-- ============================================================
create or replace function public.portal_list_projects(p_company uuid)
returns table (
  id uuid,
  name text,
  description text,
  status smallint,
  deadline date,
  progress smallint,
  progress_from_tasks boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id, p.name, p.description, p.status, p.deadline,
    p.progress, p.progress_from_tasks
  from public.projects p
  where p.company_id = p_company
    and p.deleted_at is null
    and public.is_client_of_company(p_company)
  order by p.created_at desc;
$$;

create or replace function public.portal_get_project(p_company uuid, p_id uuid)
returns table (
  id uuid,
  name text,
  description text,
  status smallint,
  deadline date,
  progress smallint,
  progress_from_tasks boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id, p.name, p.description, p.status, p.deadline,
    p.progress, p.progress_from_tasks
  from public.projects p
  where p.id = p_id
    and p.company_id = p_company
    and p.deleted_at is null
    and public.is_client_of_company(p_company);
$$;

-- ============================================================
-- 3) Tarefas do projeto (sem hourly_rate/billable/assignee)
-- ============================================================
create or replace function public.portal_list_tasks(p_project uuid)
returns table (
  id uuid,
  name text,
  description text,
  status smallint,
  priority smallint,
  start_date date,
  due_date date,
  milestone_id uuid
)
language sql
stable
security definer
set search_path = public
as $$
  select
    t.id, t.name, t.description, t.status, t.priority,
    t.start_date, t.due_date, t.milestone_id
  from public.tasks t
  where t.project_id = p_project
    and t.deleted_at is null
    and public.client_can_view_project(p_project)
  order by t.due_date asc nulls last, t.created_at asc;
$$;

-- ============================================================
-- 4) Marcos do projeto com progresso (sem depender de ler tasks)
-- ============================================================
create or replace function public.portal_list_milestones(p_project uuid)
returns table (
  id uuid,
  name text,
  description text,
  status smallint,
  color text,
  start_date date,
  due_date date,
  "position" integer,
  task_count integer,
  done_count integer,
  progress integer
)
language sql
stable
security definer
set search_path = public
as $$
  with allowed as (
    select public.client_can_view_project(p_project) as ok
  ),
  ms as (
    select m.*
    from public.milestones m
    where m.project_id = p_project
      and m.deleted_at is null
      and (select ok from allowed)
  ),
  counts as (
    select
      t.milestone_id,
      count(*)::int as total,
      (count(*) filter (where t.status = 5))::int as done
    from public.tasks t
    where t.project_id = p_project
      and t.deleted_at is null
      and t.milestone_id is not null
    group by t.milestone_id
  )
  select
    m.id, m.name, m.description, m.status, m.color,
    m.start_date, m.due_date, m.position,
    coalesce(c.total, 0) as task_count,
    coalesce(c.done, 0) as done_count,
    (case
      when m.status = 3 then 100
      when coalesce(c.total, 0) > 0
        then round((coalesce(c.done, 0)::numeric / c.total) * 100)::int
      else 0
    end) as progress
  from ms m
  left join counts c on c.milestone_id = m.id
  order by m.position asc, m.created_at asc;
$$;

-- ============================================================
-- 5) Grants (não expor ao anon; CREATE FUNCTION concede a PUBLIC)
-- ============================================================
revoke execute on function public.portal_contact() from public, anon;
revoke execute on function public.portal_list_projects(uuid) from public, anon;
revoke execute on function public.portal_get_project(uuid, uuid) from public, anon;
revoke execute on function public.portal_list_tasks(uuid) from public, anon;
revoke execute on function public.portal_list_milestones(uuid) from public, anon;

grant execute on function public.portal_contact()
  to authenticated, service_role;
grant execute on function public.portal_list_projects(uuid)
  to authenticated, service_role;
grant execute on function public.portal_get_project(uuid, uuid)
  to authenticated, service_role;
grant execute on function public.portal_list_tasks(uuid)
  to authenticated, service_role;
grant execute on function public.portal_list_milestones(uuid)
  to authenticated, service_role;

-- ============================================================
-- 6) Remove a leitura direta do cliente nas tabelas com colunas internas
--    (o portal agora lê apenas via RPC acima)
-- ============================================================
drop policy if exists "companies_client_select" on public.companies;
drop policy if exists "projects_client_select" on public.projects;
drop policy if exists "tasks_client_select" on public.tasks;
drop policy if exists "profiles_client_select" on public.profiles;

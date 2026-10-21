-- Orbit CRM — portal: SEO somente leitura via RPC
-- O cliente do portal nao e membro do tenant; a leitura direta de seo_sites e
-- seo_audits ja fica bloqueada pela RLS. Estas funcoes SECURITY DEFINER
-- projetam apenas os dados do site vinculado a empresa do contato.

-- ============================================================
-- 1) Sites de SEO visiveis ao cliente (com ultima auditoria concluida)
-- ============================================================
create or replace function public.portal_list_seo_sites(p_company uuid)
returns table (
  id uuid,
  label text,
  url text,
  score smallint,
  checks_total integer,
  issues_total integer,
  last_audit_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    s.id,
    s.label,
    s.url,
    a.score,
    coalesce(a.checks_total, 0) as checks_total,
    coalesce(a.issues_total, 0) as issues_total,
    a.created_at as last_audit_at
  from public.seo_sites s
  left join lateral (
    select
      au.score,
      au.checks_total,
      au.issues_total,
      au.created_at
    from public.seo_audits au
    where au.site_id = s.id
      and au.tenant_id = s.tenant_id
      and au.status = 2
    order by au.created_at desc
    limit 1
  ) a on true
  where s.company_id = p_company
    and s.deleted_at is null
    and public.is_client_of_company(p_company)
  order by s.created_at desc;
$$;

-- ============================================================
-- 2) Ultima auditoria concluida de um site do cliente
-- ============================================================
create or replace function public.portal_get_seo_audit(
  p_company uuid,
  p_site uuid
)
returns table (
  site_id uuid,
  label text,
  url text,
  score smallint,
  checks_total integer,
  issues_total integer,
  major_issues integer,
  moderate_issues integer,
  minor_issues integer,
  result jsonb,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    s.id as site_id,
    s.label,
    s.url,
    a.score,
    coalesce(a.checks_total, 0) as checks_total,
    coalesce(a.issues_total, 0) as issues_total,
    coalesce(a.major_issues, 0) as major_issues,
    coalesce(a.moderate_issues, 0) as moderate_issues,
    coalesce(a.minor_issues, 0) as minor_issues,
    a.result,
    a.created_at
  from public.seo_sites s
  left join lateral (
    select
      au.score,
      au.checks_total,
      au.issues_total,
      au.major_issues,
      au.moderate_issues,
      au.minor_issues,
      au.result,
      au.created_at
    from public.seo_audits au
    where au.site_id = s.id
      and au.tenant_id = s.tenant_id
      and au.status = 2
    order by au.created_at desc
    limit 1
  ) a on true
  where s.id = p_site
    and s.company_id = p_company
    and s.deleted_at is null
    and public.is_client_of_company(p_company);
$$;

-- ============================================================
-- 3) Grants (nao expor ao anon)
-- ============================================================
revoke execute on function public.portal_list_seo_sites(uuid) from public, anon;
revoke execute on function public.portal_get_seo_audit(uuid, uuid) from public, anon;

grant execute on function public.portal_list_seo_sites(uuid)
  to authenticated, service_role;
grant execute on function public.portal_get_seo_audit(uuid, uuid)
  to authenticated, service_role;

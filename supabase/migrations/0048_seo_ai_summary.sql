-- Orbit CRM — SEO: resumo com IA por auditoria

alter table public.seo_audits
  add column if not exists ai_summary text;

-- Atualiza a leitura do portal para incluir o resumo, quando existir.
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
  ai_summary text,
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
    a.ai_summary,
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
      au.ai_summary,
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

revoke execute on function public.portal_get_seo_audit(uuid, uuid)
  from public, anon;
grant execute on function public.portal_get_seo_audit(uuid, uuid)
  to authenticated, service_role;

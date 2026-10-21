-- Orbit CRM — SEO: sites monitorados, auditorias e histórico

create table if not exists public.seo_sites (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  company_id uuid,
  label text not null,
  url text not null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint seo_sites_company_fk foreign key (company_id, tenant_id)
    references public.companies (id, tenant_id) on delete set null (company_id)
);

create unique index if not exists seo_sites_id_tenant_key
  on public.seo_sites (id, tenant_id);
create index if not exists seo_sites_tenant_idx
  on public.seo_sites (tenant_id) where deleted_at is null;
create index if not exists seo_sites_company_idx
  on public.seo_sites (company_id) where deleted_at is null;

drop trigger if exists seo_sites_set_updated_at on public.seo_sites;
create trigger seo_sites_set_updated_at
  before update on public.seo_sites
  for each row execute function public.set_updated_at();

create table if not exists public.seo_audits (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  site_id uuid not null,
  url text not null,
  status smallint not null default 1 check (status between 1 and 3),
  score smallint check (score between 0 and 100),
  checks_total integer not null default 0,
  issues_total integer not null default 0,
  major_issues integer not null default 0,
  moderate_issues integer not null default 0,
  minor_issues integer not null default 0,
  result jsonb,
  error text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  finished_at timestamptz,
  constraint seo_audits_site_fk foreign key (site_id, tenant_id)
    references public.seo_sites (id, tenant_id) on delete cascade
);

create unique index if not exists seo_audits_id_tenant_key
  on public.seo_audits (id, tenant_id);
create index if not exists seo_audits_tenant_idx
  on public.seo_audits (tenant_id);
create index if not exists seo_audits_site_created_idx
  on public.seo_audits (site_id, created_at desc);

grant select, insert, update, delete on public.seo_sites to authenticated;
grant all on public.seo_sites to service_role;
grant all on public.seo_sites to postgres;

grant select, insert, update, delete on public.seo_audits to authenticated;
grant all on public.seo_audits to service_role;
grant all on public.seo_audits to postgres;

alter table public.seo_sites enable row level security;
alter table public.seo_audits enable row level security;

create policy "seo_sites_select" on public.seo_sites
  for select to authenticated using (public.is_tenant_member(tenant_id));
create policy "seo_sites_insert" on public.seo_sites
  for insert to authenticated with check (public.is_tenant_member(tenant_id));
create policy "seo_sites_update" on public.seo_sites
  for update to authenticated
  using (public.is_tenant_member(tenant_id))
  with check (public.is_tenant_member(tenant_id));
create policy "seo_sites_delete" on public.seo_sites
  for delete to authenticated using (public.has_tenant_role(tenant_id, array['owner', 'admin']));

create policy "seo_audits_select" on public.seo_audits
  for select to authenticated using (public.is_tenant_member(tenant_id));
create policy "seo_audits_insert" on public.seo_audits
  for insert to authenticated with check (public.is_tenant_member(tenant_id));
create policy "seo_audits_update" on public.seo_audits
  for update to authenticated
  using (public.is_tenant_member(tenant_id))
  with check (public.is_tenant_member(tenant_id));
create policy "seo_audits_delete" on public.seo_audits
  for delete to authenticated using (public.has_tenant_role(tenant_id, array['owner', 'admin']));

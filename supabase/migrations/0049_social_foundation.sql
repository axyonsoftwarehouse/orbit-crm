-- Orbit CRM — Social: contas, posts, targets, eventos e aprovação

create table if not exists public.social_settings (
  tenant_id uuid primary key references public.tenants (id) on delete cascade,
  approval_required boolean not null default true,
  default_timezone text not null default 'America/Sao_Paulo',
  ai_enabled boolean not null default false,
  max_retries integer not null default 3 check (max_retries between 0 and 10),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.social_accounts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  company_id uuid,
  provider text not null check (
    provider in ('linkedin', 'instagram', 'facebook', 'x', 'tiktok', 'threads', 'youtube', 'pinterest')
  ),
  provider_account_id text not null,
  display_name text not null,
  avatar_url text,
  status smallint not null default 1 check (status between 1 and 4),
  metadata jsonb not null default '{}'::jsonb,
  connected_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint social_accounts_company_fk foreign key (company_id, tenant_id)
    references public.companies (id, tenant_id) on delete set null (company_id)
);

create unique index if not exists social_accounts_id_tenant_key
  on public.social_accounts (id, tenant_id);
create unique index if not exists social_accounts_provider_account_key
  on public.social_accounts (tenant_id, provider, provider_account_id)
  where deleted_at is null;
create index if not exists social_accounts_tenant_idx
  on public.social_accounts (tenant_id) where deleted_at is null;
create index if not exists social_accounts_company_idx
  on public.social_accounts (company_id) where deleted_at is null;

drop trigger if exists social_accounts_set_updated_at on public.social_accounts;
create trigger social_accounts_set_updated_at
  before update on public.social_accounts
  for each row execute function public.set_updated_at();

create table if not exists public.social_posts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  company_id uuid,
  created_by uuid references public.profiles (id) on delete set null,
  content text not null check (char_length(content) between 1 and 5000),
  status text not null default 'draft' check (
    status in (
      'draft',
      'pending_approval',
      'approved',
      'scheduled',
      'publishing',
      'published',
      'partially_published',
      'failed',
      'cancelled',
      'rejected'
    )
  ),
  scheduled_at timestamptz,
  published_at timestamptz,
  requires_approval boolean not null default true,
  approved_by uuid references public.profiles (id) on delete set null,
  approved_at timestamptz,
  rejected_by uuid references public.profiles (id) on delete set null,
  rejected_at timestamptz,
  rejection_note text,
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint social_posts_company_fk foreign key (company_id, tenant_id)
    references public.companies (id, tenant_id) on delete set null (company_id)
);

create unique index if not exists social_posts_id_tenant_key
  on public.social_posts (id, tenant_id);
create index if not exists social_posts_tenant_status_idx
  on public.social_posts (tenant_id, status, scheduled_at) where deleted_at is null;
create index if not exists social_posts_company_idx
  on public.social_posts (company_id, created_at desc) where deleted_at is null;

drop trigger if exists social_posts_set_updated_at on public.social_posts;
create trigger social_posts_set_updated_at
  before update on public.social_posts
  for each row execute function public.set_updated_at();

create table if not exists public.social_post_targets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  post_id uuid not null,
  account_id uuid not null,
  status text not null default 'pending' check (
    status in ('pending', 'publishing', 'published', 'failed')
  ),
  external_post_id text,
  error text,
  published_at timestamptz,
  attempts integer not null default 0 check (attempts >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint social_post_targets_post_fk foreign key (post_id, tenant_id)
    references public.social_posts (id, tenant_id) on delete cascade,
  constraint social_post_targets_account_fk foreign key (account_id, tenant_id)
    references public.social_accounts (id, tenant_id) on delete cascade
);

create unique index if not exists social_post_targets_post_account_key
  on public.social_post_targets (post_id, account_id);
create index if not exists social_post_targets_tenant_idx
  on public.social_post_targets (tenant_id);
create index if not exists social_post_targets_post_idx
  on public.social_post_targets (post_id);

drop trigger if exists social_post_targets_set_updated_at on public.social_post_targets;
create trigger social_post_targets_set_updated_at
  before update on public.social_post_targets
  for each row execute function public.set_updated_at();

create table if not exists public.social_post_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  post_id uuid not null,
  event text not null,
  actor_id uuid references public.profiles (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint social_post_events_post_fk foreign key (post_id, tenant_id)
    references public.social_posts (id, tenant_id) on delete cascade
);

create index if not exists social_post_events_post_idx
  on public.social_post_events (post_id, created_at desc);
create index if not exists social_post_events_tenant_idx
  on public.social_post_events (tenant_id);

grant select, insert, update, delete on public.social_settings to authenticated;
grant select, insert, update, delete on public.social_accounts to authenticated;
grant select, insert, update, delete on public.social_posts to authenticated;
grant select, insert, update, delete on public.social_post_targets to authenticated;
grant select, insert, update, delete on public.social_post_events to authenticated;
grant all on public.social_settings to service_role, postgres;
grant all on public.social_accounts to service_role, postgres;
grant all on public.social_posts to service_role, postgres;
grant all on public.social_post_targets to service_role, postgres;
grant all on public.social_post_events to service_role, postgres;

alter table public.social_settings enable row level security;
alter table public.social_accounts enable row level security;
alter table public.social_posts enable row level security;
alter table public.social_post_targets enable row level security;
alter table public.social_post_events enable row level security;

create policy "social_settings_select" on public.social_settings
  for select to authenticated using (public.is_tenant_member(tenant_id));
create policy "social_settings_insert" on public.social_settings
  for insert to authenticated
  with check (public.has_tenant_role(tenant_id, array['owner', 'admin']));
create policy "social_settings_update" on public.social_settings
  for update to authenticated
  using (public.has_tenant_role(tenant_id, array['owner', 'admin']))
  with check (public.has_tenant_role(tenant_id, array['owner', 'admin']));

create policy "social_accounts_select" on public.social_accounts
  for select to authenticated using (public.is_tenant_member(tenant_id));
create policy "social_accounts_insert" on public.social_accounts
  for insert to authenticated
  with check (public.has_tenant_role(tenant_id, array['owner', 'admin']));
create policy "social_accounts_update" on public.social_accounts
  for update to authenticated
  using (public.has_tenant_role(tenant_id, array['owner', 'admin']))
  with check (public.has_tenant_role(tenant_id, array['owner', 'admin']));
create policy "social_accounts_delete" on public.social_accounts
  for delete to authenticated
  using (public.has_tenant_role(tenant_id, array['owner', 'admin']));

create policy "social_posts_select" on public.social_posts
  for select to authenticated using (public.is_tenant_member(tenant_id));
create policy "social_posts_insert" on public.social_posts
  for insert to authenticated with check (public.is_tenant_member(tenant_id));
create policy "social_posts_update" on public.social_posts
  for update to authenticated
  using (public.is_tenant_member(tenant_id))
  with check (public.is_tenant_member(tenant_id));
create policy "social_posts_delete" on public.social_posts
  for delete to authenticated
  using (public.has_tenant_role(tenant_id, array['owner', 'admin']));

create policy "social_post_targets_select" on public.social_post_targets
  for select to authenticated using (public.is_tenant_member(tenant_id));
create policy "social_post_targets_insert" on public.social_post_targets
  for insert to authenticated with check (public.is_tenant_member(tenant_id));
create policy "social_post_targets_update" on public.social_post_targets
  for update to authenticated
  using (public.is_tenant_member(tenant_id))
  with check (public.is_tenant_member(tenant_id));
create policy "social_post_targets_delete" on public.social_post_targets
  for delete to authenticated
  using (public.is_tenant_member(tenant_id));

create policy "social_post_events_select" on public.social_post_events
  for select to authenticated using (public.is_tenant_member(tenant_id));
create policy "social_post_events_insert" on public.social_post_events
  for insert to authenticated with check (public.is_tenant_member(tenant_id));

-- ============================================================
-- Portal do cliente: leitura e resposta de posts
-- ============================================================
create or replace function public.portal_list_social_posts(p_company uuid)
returns table (
  id uuid,
  content text,
  status text,
  scheduled_at timestamptz,
  published_at timestamptz,
  created_at timestamptz,
  requires_approval boolean,
  rejection_note text,
  target_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.content,
    p.status,
    p.scheduled_at,
    p.published_at,
    p.created_at,
    p.requires_approval,
    p.rejection_note,
    (select count(*) from public.social_post_targets t where t.post_id = p.id) as target_count
  from public.social_posts p
  where p.company_id = p_company
    and p.deleted_at is null
    and p.status <> 'draft'
    and public.is_client_of_company(p_company)
  order by p.created_at desc;
$$;

create or replace function public.portal_get_social_post(
  p_company uuid,
  p_post uuid
)
returns table (
  id uuid,
  content text,
  status text,
  scheduled_at timestamptz,
  published_at timestamptz,
  created_at timestamptz,
  requires_approval boolean,
  rejection_note text,
  targets jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.content,
    p.status,
    p.scheduled_at,
    p.published_at,
    p.created_at,
    p.requires_approval,
    p.rejection_note,
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'provider', a.provider,
          'display_name', a.display_name,
          'status', t.status
        )
        order by a.provider
      ) filter (where t.id is not null),
      '[]'::jsonb
    ) as targets
  from public.social_posts p
  left join public.social_post_targets t on t.post_id = p.id
  left join public.social_accounts a on a.id = t.account_id
  where p.id = p_post
    and p.company_id = p_company
    and p.deleted_at is null
    and p.status <> 'draft'
    and public.is_client_of_company(p_company)
  group by p.id;
$$;

create or replace function public.portal_respond_social_post(
  p_company uuid,
  p_post uuid,
  p_approve boolean,
  p_note text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
begin
  if not public.is_client_of_company(p_company) then
    return false;
  end if;

  select status into v_status
  from public.social_posts
  where id = p_post
    and company_id = p_company
    and deleted_at is null;

  if v_status is null or v_status <> 'pending_approval' then
    return false;
  end if;

  update public.social_posts
  set
    status = case when p_approve then 'approved' else 'rejected' end,
    approved_by = case when p_approve then auth.uid() else null end,
    approved_at = case when p_approve then now() else null end,
    rejected_by = case when p_approve then null else auth.uid() end,
    rejected_at = case when p_approve then null else now() end,
    rejection_note = case when p_approve then null else p_note end
  where id = p_post
    and company_id = p_company;

  insert into public.social_post_events (tenant_id, post_id, event, actor_id, metadata)
  select tenant_id, id,
    case when p_approve then 'approved' else 'rejected' end,
    auth.uid(),
    jsonb_build_object('source', 'portal', 'note', p_note)
  from public.social_posts
  where id = p_post;

  return true;
end;
$$;

revoke execute on function public.portal_list_social_posts(uuid) from public, anon;
revoke execute on function public.portal_get_social_post(uuid, uuid) from public, anon;
revoke execute on function public.portal_respond_social_post(uuid, uuid, boolean, text) from public, anon;

grant execute on function public.portal_list_social_posts(uuid)
  to authenticated, service_role;
grant execute on function public.portal_get_social_post(uuid, uuid)
  to authenticated, service_role;
grant execute on function public.portal_respond_social_post(uuid, uuid, boolean, text)
  to authenticated, service_role;

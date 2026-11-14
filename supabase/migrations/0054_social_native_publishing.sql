alter table public.social_accounts
  add column if not exists account_type text not null default 'member'
    check (account_type in ('member', 'organization', 'instagram')),
  add column if not exists access_token_id uuid,
  add column if not exists refresh_token_id uuid,
  add column if not exists token_expires_at timestamptz,
  add column if not exists scopes text[] not null default '{}'::text[],
  add column if not exists last_synced_at timestamptz;

update public.social_accounts
set account_type = 'instagram'
where provider = 'instagram' and account_type = 'member';

alter table public.social_post_targets
  add column if not exists next_attempt_at timestamptz,
  add column if not exists locked_at timestamptz,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create index if not exists social_post_targets_due_idx
  on public.social_post_targets (status, next_attempt_at)
  where status in ('pending', 'failed');

create or replace function public.social_store_tokens(
  p_account uuid,
  p_access_token text,
  p_refresh_token text,
  p_expires_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  v_access_id uuid;
  v_refresh_id uuid;
  v_access_name text := 'social_access_' || p_account::text;
  v_refresh_name text := 'social_refresh_' || p_account::text;
begin
  select access_token_id, refresh_token_id
  into v_access_id, v_refresh_id
  from public.social_accounts
  where id = p_account;

  if not found then
    raise exception 'conta social nao encontrada';
  end if;

  if v_access_id is null then
    v_access_id := vault.create_secret(
      p_access_token,
      v_access_name,
      'Orbit CRM social access token'
    );
  else
    perform vault.update_secret(
      v_access_id,
      p_access_token,
      v_access_name,
      'Orbit CRM social access token'
    );
  end if;

  if p_refresh_token is not null and p_refresh_token <> '' then
    if v_refresh_id is null then
      v_refresh_id := vault.create_secret(
        p_refresh_token,
        v_refresh_name,
        'Orbit CRM social refresh token'
      );
    else
      perform vault.update_secret(
        v_refresh_id,
        p_refresh_token,
        v_refresh_name,
        'Orbit CRM social refresh token'
      );
    end if;
  end if;

  update public.social_accounts
  set
    access_token_id = v_access_id,
    refresh_token_id = coalesce(v_refresh_id, refresh_token_id),
    token_expires_at = p_expires_at,
    updated_at = now()
  where id = p_account;
end;
$$;

create or replace function public.social_get_tokens(p_account uuid)
returns table (
  access_token text,
  refresh_token text,
  expires_at timestamptz
)
language sql
stable
security definer
set search_path = public, vault
as $$
  select
    access_secret.decrypted_secret as access_token,
    refresh_secret.decrypted_secret as refresh_token,
    a.token_expires_at as expires_at
  from public.social_accounts a
  left join vault.decrypted_secrets access_secret
    on access_secret.id = a.access_token_id
  left join vault.decrypted_secrets refresh_secret
    on refresh_secret.id = a.refresh_token_id
  where a.id = p_account;
$$;

create or replace function public.social_clear_tokens(p_account uuid)
returns void
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  v_access_id uuid;
  v_refresh_id uuid;
begin
  select access_token_id, refresh_token_id
  into v_access_id, v_refresh_id
  from public.social_accounts
  where id = p_account;

  if v_access_id is not null then
    delete from vault.secrets where id = v_access_id;
  end if;
  if v_refresh_id is not null then
    delete from vault.secrets where id = v_refresh_id;
  end if;

  update public.social_accounts
  set
    access_token_id = null,
    refresh_token_id = null,
    token_expires_at = null,
    updated_at = now()
  where id = p_account;
end;
$$;

create or replace function public.claim_social_publish_targets(p_limit integer default 5)
returns table (
  target_id uuid,
  tenant_id uuid,
  post_id uuid,
  account_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with due as (
    select t.id
    from public.social_post_targets t
    join public.social_posts p
      on p.id = t.post_id and p.tenant_id = t.tenant_id
    join public.social_accounts a
      on a.id = t.account_id and a.tenant_id = t.tenant_id
    left join public.social_settings s
      on s.tenant_id = p.tenant_id
    where t.status in ('pending', 'failed')
      and (t.next_attempt_at is null or t.next_attempt_at <= now())
      and p.status in ('scheduled', 'publishing')
      and p.scheduled_at is not null
      and p.scheduled_at <= now()
      and p.deleted_at is null
      and a.deleted_at is null
      and a.status = 1
      and a.provider in ('instagram', 'linkedin')
      and coalesce(s.publish_mode, 'manual') = 'provider'
    order by p.scheduled_at asc, t.created_at asc
    limit greatest(least(p_limit, 50), 1)
    for update of t skip locked
  )
  update public.social_post_targets t
  set
    status = 'publishing',
    locked_at = now(),
    error = null,
    updated_at = now()
  from due
  where t.id = due.id
  returning t.id, t.tenant_id, t.post_id, t.account_id;
end;
$$;

create or replace function public.reset_stale_social_targets(p_minutes integer default 10)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  update public.social_post_targets
  set
    status = 'pending',
    locked_at = null,
    updated_at = now()
  where status = 'publishing'
    and locked_at is not null
    and locked_at < now() - make_interval(mins => greatest(p_minutes, 1));

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create or replace function public.configure_social_publish_cron(
  p_site_url text,
  p_cron_secret text
)
returns void
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  v_job bigint;
  v_url_id uuid;
  v_secret_id uuid;
begin
  execute 'create extension if not exists pg_cron';
  execute 'create extension if not exists pg_net';

  select id into v_url_id
  from vault.secrets
  where name = 'social_publish_url';

  if v_url_id is null then
    perform vault.create_secret(
      rtrim(p_site_url, '/'),
      'social_publish_url',
      'Orbit CRM social publish endpoint'
    );
  else
    perform vault.update_secret(
      v_url_id,
      rtrim(p_site_url, '/'),
      'social_publish_url',
      'Orbit CRM social publish endpoint'
    );
  end if;

  select id into v_secret_id
  from vault.secrets
  where name = 'social_publish_secret';

  if v_secret_id is null then
    perform vault.create_secret(
      p_cron_secret,
      'social_publish_secret',
      'Orbit CRM social publish cron secret'
    );
  else
    perform vault.update_secret(
      v_secret_id,
      p_cron_secret,
      'social_publish_secret',
      'Orbit CRM social publish cron secret'
    );
  end if;

  select jobid into v_job from cron.job where jobname = 'social-publish';
  if v_job is not null then
    perform cron.unschedule(v_job);
  end if;

  perform cron.schedule(
    'social-publish',
    '* * * * *',
    $job$
      select net.http_post(
        url := (select decrypted_secret from vault.decrypted_secrets where name = 'social_publish_url') || '/api/social/publish',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'social_publish_secret')
        ),
        body := '{}'::jsonb
      );
    $job$
  );
end;
$$;

revoke execute on function public.social_store_tokens(uuid, text, text, timestamptz)
  from public, anon, authenticated;
revoke execute on function public.social_get_tokens(uuid)
  from public, anon, authenticated;
revoke execute on function public.social_clear_tokens(uuid)
  from public, anon, authenticated;
revoke execute on function public.claim_social_publish_targets(integer)
  from public, anon, authenticated;
revoke execute on function public.reset_stale_social_targets(integer)
  from public, anon, authenticated;
revoke execute on function public.configure_social_publish_cron(text, text)
  from public, anon, authenticated;

grant execute on function public.social_store_tokens(uuid, text, text, timestamptz)
  to service_role;
grant execute on function public.social_get_tokens(uuid)
  to service_role;
grant execute on function public.social_clear_tokens(uuid)
  to service_role;
grant execute on function public.claim_social_publish_targets(integer)
  to service_role;
grant execute on function public.reset_stale_social_targets(integer)
  to service_role;
grant execute on function public.configure_social_publish_cron(text, text)
  to service_role;

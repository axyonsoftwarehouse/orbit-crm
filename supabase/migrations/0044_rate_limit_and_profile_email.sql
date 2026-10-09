-- Orbit CRM — P1: rate limit distribuído + e-mail em profiles

-- ============================================================
-- 1) Rate limit distribuído (funciona entre instâncias serverless)
--    Acesso apenas via service_role / função SECURITY DEFINER.
-- ============================================================
create table if not exists public.rate_limit_hits (
  id bigint generated always as identity primary key,
  bucket text not null,
  created_at timestamptz not null default now()
);

create index if not exists rate_limit_hits_bucket_idx
  on public.rate_limit_hits (bucket, created_at);

alter table public.rate_limit_hits enable row level security;
-- Sem policies: só a função definer / service_role acessa.

create or replace function public.check_rate_limit(
  p_bucket text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  -- limpeza best-effort dos registros antigos
  delete from public.rate_limit_hits
    where created_at < now() - interval '1 day';

  select count(*) into v_count
  from public.rate_limit_hits
  where bucket = p_bucket
    and created_at > now() - make_interval(secs => p_window_seconds);

  if v_count >= p_limit then
    return false;
  end if;

  insert into public.rate_limit_hits (bucket) values (p_bucket);
  return true;
end;
$$;

revoke execute on function public.check_rate_limit(text, integer, integer)
  from public, anon;
grant execute on function public.check_rate_limit(text, integer, integer)
  to authenticated, service_role;

-- ============================================================
-- 2) profiles.email (elimina o listUsers(200) na busca por e-mail)
-- ============================================================
alter table public.profiles add column if not exists email text;

update public.profiles p
  set email = u.email
  from auth.users u
  where p.id = u.id and p.email is distinct from u.email;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

create or replace function public.handle_user_email_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
    set email = new.email
    where id = new.id and email is distinct from new.email;
  return new;
end;
$$;

revoke execute on function public.handle_user_email_update() from public, anon;
grant execute on function public.handle_user_email_update()
  to authenticated, service_role;

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row execute function public.handle_user_email_update();

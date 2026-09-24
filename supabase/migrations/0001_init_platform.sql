-- Orbit CRM — Fase 0: plataforma (profiles, tenants, memberships, invitations)
-- Multi-tenancy por tenant_id + Row Level Security.

create extension if not exists "pgcrypto";

-- ============================================================
-- Tabelas
-- ============================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  is_super_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  primary_color text,
  logo_url text,
  status text not null default 'active' check (status in ('active', 'suspended')),
  plan text not null default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  status text not null default 'active' check (status in ('active', 'invited', 'disabled')),
  created_at timestamptz not null default now(),
  unique (tenant_id, user_id)
);

create index if not exists memberships_user_idx on public.memberships (user_id);
create index if not exists memberships_tenant_idx on public.memberships (tenant_id);

create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  email text not null,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  token uuid not null default gen_random_uuid() unique,
  invited_by uuid references public.profiles (id) on delete set null,
  accepted_at timestamptz,
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now()
);

create index if not exists invitations_tenant_idx on public.invitations (tenant_id);
create index if not exists invitations_email_idx on public.invitations (lower(email));

-- ============================================================
-- Funções auxiliares (security definer: ignoram RLS para evitar recursão)
-- ============================================================

create or replace function public.is_tenant_member(p_tenant uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships m
    where m.tenant_id = p_tenant
      and m.user_id = auth.uid()
      and m.status = 'active'
  );
$$;

create or replace function public.has_tenant_role(p_tenant uuid, p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships m
    where m.tenant_id = p_tenant
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role = any (p_roles)
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.is_super_admin
  );
$$;

create or replace function public.shares_tenant(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships mine
    join public.memberships theirs on theirs.tenant_id = mine.tenant_id
    where mine.user_id = auth.uid()
      and theirs.user_id = target
      and mine.status = 'active'
      and theirs.status = 'active'
  );
$$;

-- updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists tenants_set_updated_at on public.tenants;
create trigger tenants_set_updated_at
  before update on public.tenants
  for each row execute function public.set_updated_at();

-- Cria profile automaticamente ao registrar um usuário em auth.users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Grants
-- ============================================================

grant usage on schema public to anon, authenticated, service_role;

grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.tenants to authenticated;
grant select, insert, update, delete on public.memberships to authenticated;
grant select, insert, update, delete on public.invitations to authenticated;

grant all on public.profiles, public.tenants, public.memberships, public.invitations to service_role;
grant all on public.profiles, public.tenants, public.memberships, public.invitations to postgres;

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.profiles enable row level security;
alter table public.tenants enable row level security;
alter table public.memberships enable row level security;
alter table public.invitations enable row level security;

-- profiles ---------------------------------------------------
create policy "profiles_select_self_or_admin" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_super_admin());

create policy "profiles_select_shared_tenant" on public.profiles
  for select to authenticated
  using (public.shares_tenant(id));

create policy "profiles_update_self" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- tenants ----------------------------------------------------
create policy "tenants_select_member" on public.tenants
  for select to authenticated
  using (public.is_tenant_member(id) or public.is_super_admin());

create policy "tenants_insert_super_admin" on public.tenants
  for insert to authenticated
  with check (public.is_super_admin());

create policy "tenants_update_admin" on public.tenants
  for update to authenticated
  using (public.has_tenant_role(id, array['owner', 'admin']) or public.is_super_admin())
  with check (public.has_tenant_role(id, array['owner', 'admin']) or public.is_super_admin());

create policy "tenants_delete_super_admin" on public.tenants
  for delete to authenticated
  using (public.is_super_admin());

-- memberships ------------------------------------------------
create policy "memberships_select" on public.memberships
  for select to authenticated
  using (public.is_tenant_member(tenant_id) or public.is_super_admin());

create policy "memberships_insert" on public.memberships
  for insert to authenticated
  with check (public.has_tenant_role(tenant_id, array['owner', 'admin']) or public.is_super_admin());

create policy "memberships_update" on public.memberships
  for update to authenticated
  using (public.has_tenant_role(tenant_id, array['owner', 'admin']) or public.is_super_admin())
  with check (public.has_tenant_role(tenant_id, array['owner', 'admin']) or public.is_super_admin());

create policy "memberships_delete" on public.memberships
  for delete to authenticated
  using (public.has_tenant_role(tenant_id, array['owner', 'admin']) or public.is_super_admin());

-- invitations ------------------------------------------------
create policy "invitations_select" on public.invitations
  for select to authenticated
  using (public.has_tenant_role(tenant_id, array['owner', 'admin']) or public.is_super_admin());

create policy "invitations_insert" on public.invitations
  for insert to authenticated
  with check (public.has_tenant_role(tenant_id, array['owner', 'admin']) or public.is_super_admin());

create policy "invitations_update" on public.invitations
  for update to authenticated
  using (public.has_tenant_role(tenant_id, array['owner', 'admin']) or public.is_super_admin())
  with check (public.has_tenant_role(tenant_id, array['owner', 'admin']) or public.is_super_admin());

create policy "invitations_delete" on public.invitations
  for delete to authenticated
  using (public.has_tenant_role(tenant_id, array['owner', 'admin']) or public.is_super_admin());

-- Orbit CRM — hardening de segurança (baixo)

-- ============================================================
-- 1) Planos: apenas staff autenticado ou super-admin podem ler
--    (antes: qualquer autenticado, incluindo cliente do portal)
-- ============================================================
create or replace function public.is_authenticated_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.memberships
    where user_id = auth.uid() and status = 'active'
  );
$$;

drop policy if exists "plans_select" on public.plans;
create policy "plans_select" on public.plans
  for select to authenticated
  using (public.is_super_admin() or public.is_authenticated_staff());

-- ============================================================
-- 2) RPCs SECURITY DEFINER: não expor ao papel anon
--    (Postgres concede EXECUTE a PUBLIC por padrão)
-- ============================================================
revoke execute on all functions in schema public from public, anon;
grant execute on all functions in schema public to authenticated, service_role;

-- Orbit CRM — hardening de segurança (crítico)
-- Fecha escalonamento de privilégio: qualquer usuário autenticado conseguia
-- promover a si mesmo a super-admin com um UPDATE em profiles.is_super_admin.

-- 1) Remove o UPDATE de tabela em profiles e concede apenas as colunas que o
--    próprio usuário pode editar. Sem privilégio de coluna, o PostgREST recusa
--    a alteração de is_super_admin antes mesmo de chegar à RLS.
revoke update on public.profiles from authenticated;
grant update (full_name, avatar_url, notify_email)
  on public.profiles to authenticated;

-- 2) Defesa em profundidade: bloqueia mudanças em is_super_admin feitas por
--    requisições autenticadas que não sejam de um super-admin. auth.uid() nulo
--    indica contexto de serviço/CLI (service_role/postgres), que é permitido.
create or replace function public.protect_super_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_super_admin is distinct from old.is_super_admin then
    if auth.uid() is not null and not public.is_super_admin() then
      raise exception 'is_super_admin não pode ser alterado por este usuário';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_super_admin on public.profiles;
create trigger profiles_protect_super_admin
  before update on public.profiles
  for each row execute function public.protect_super_admin();

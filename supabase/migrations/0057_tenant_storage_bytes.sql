-- Orbit CRM — uso de armazenamento por tenant (cota `storage_mb` do plano)
--
-- Soma `size_bytes` dos anexos e das mídias do Social. `security invoker`:
-- o RLS limita a soma às linhas que quem chama enxerga, então outro tenant
-- recebe 0.

create or replace function public.tenant_storage_bytes(p_tenant uuid)
returns bigint
language sql
stable
security invoker
set search_path = public
as $$
  select
    coalesce((select sum(size_bytes) from public.attachments where tenant_id = p_tenant), 0)
    + coalesce((select sum(size_bytes) from public.social_media where tenant_id = p_tenant), 0);
$$;

revoke execute on function public.tenant_storage_bytes(uuid) from public, anon;
grant execute on function public.tenant_storage_bytes(uuid)
  to authenticated, service_role;

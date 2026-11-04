-- Orbit CRM — exclusão de clientes, projetos e tarefas só para owner/admin
-- As server actions já exigem isManager, mas a RLS permitia que qualquer membro
-- ativo do tenant marcasse deleted_at (soft delete) ou fizesse DELETE direto
-- pela API com o próprio JWT. Esta migration leva a regra para o banco.

-- 1) Soft delete: bloqueia mudanças em deleted_at feitas por requisições
--    autenticadas de quem não é owner/admin do tenant. auth.uid() nulo indica
--    contexto de serviço/CLI (service_role/postgres), que é permitido.
create or replace function public.protect_soft_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.deleted_at is distinct from old.deleted_at then
    if auth.uid() is not null
      and not public.has_tenant_role(old.tenant_id, array['owner', 'admin']) then
      raise exception 'apenas owner/admin podem excluir ou restaurar este registro'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists companies_protect_soft_delete on public.companies;
create trigger companies_protect_soft_delete
  before update on public.companies
  for each row execute function public.protect_soft_delete();

drop trigger if exists projects_protect_soft_delete on public.projects;
create trigger projects_protect_soft_delete
  before update on public.projects
  for each row execute function public.protect_soft_delete();

drop trigger if exists tasks_protect_soft_delete on public.tasks;
create trigger tasks_protect_soft_delete
  before update on public.tasks
  for each row execute function public.protect_soft_delete();

-- 2) Hard delete: o app não apaga essas linhas, mas a policy permitia a
--    qualquer membro. Restringe a owner/admin.
drop policy if exists "companies_delete" on public.companies;
create policy "companies_delete" on public.companies
  for delete to authenticated
  using (public.has_tenant_role(tenant_id, array['owner', 'admin']));

drop policy if exists "projects_delete" on public.projects;
create policy "projects_delete" on public.projects
  for delete to authenticated
  using (public.has_tenant_role(tenant_id, array['owner', 'admin']));

drop policy if exists "tasks_delete" on public.tasks;
create policy "tasks_delete" on public.tasks
  for delete to authenticated
  using (public.has_tenant_role(tenant_id, array['owner', 'admin']));

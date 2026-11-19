-- Orbit CRM — portal_respond_social_post sem corrida
--
-- Antes, duas respostas simultâneas do portal liam `pending_approval` ao mesmo
-- tempo e as duas atualizavam o post e gravavam evento (a última vencia e a
-- equipe recebia avisos contraditórios). Agora a linha é travada com
-- FOR UPDATE, o UPDATE só vale enquanto o post está pendente e a função só
-- devolve `true` para quem de fato fez a transição.

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
  v_tenant uuid;
begin
  if not public.is_client_of_company(p_company) then
    return false;
  end if;

  select status, tenant_id into v_status, v_tenant
  from public.social_posts
  where id = p_post
    and company_id = p_company
    and deleted_at is null
  for update;

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
    and company_id = p_company
    and status = 'pending_approval';

  if not found then
    return false;
  end if;

  insert into public.social_post_events (tenant_id, post_id, event, actor_id, metadata)
  values (
    v_tenant,
    p_post,
    case when p_approve then 'approved' else 'rejected' end,
    auth.uid(),
    jsonb_build_object('source', 'portal', 'note', p_note)
  );

  return true;
end;
$$;

revoke execute on function public.portal_respond_social_post(uuid, uuid, boolean, text) from public, anon;
grant execute on function public.portal_respond_social_post(uuid, uuid, boolean, text)
  to authenticated, service_role;

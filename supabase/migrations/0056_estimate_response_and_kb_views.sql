-- Orbit CRM — resposta a orçamento só quando enviado + contador da base de
-- conhecimento atômico e sem mexer em updated_at

-- ============================================================
-- 1) client_respond_estimate: só orçamento "Enviado" (status 2)
--    Antes, qualquer orçamento visível ao cliente (status <> 1) podia ser
--    respondido a qualquer momento: recusar um já aceito, aceitar um
--    expirado, alternar a resposta. A tela do portal já só oferecia os
--    botões para orçamentos enviados; agora o banco garante a mesma regra.
-- ============================================================
create or replace function public.client_respond_estimate(
  p_estimate uuid,
  p_accept boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.client_can_view_document('estimate', p_estimate) then
    raise exception 'not allowed';
  end if;

  update public.estimates
    set status = case when p_accept then 4 else 3 end
    where id = p_estimate
      and status = 2
      and deleted_at is null;

  if not found then
    raise exception 'estimate is not awaiting response';
  end if;
end;
$$;

revoke execute on function public.client_respond_estimate(uuid, boolean) from public, anon;
grant execute on function public.client_respond_estimate(uuid, boolean)
  to authenticated, service_role;

-- ============================================================
-- 2) Visualizações da base de conhecimento
--    Antes, a leitura do artigo fazia read-then-write (`views + 1` calculado
--    no app), perdendo contagens simultâneas, e o trigger de updated_at
--    marcava o artigo como "atualizado" a cada visualização.
-- ============================================================
create or replace function public.increment_kb_article_views(p_article uuid)
returns void
language sql
security invoker
set search_path = public
as $$
  update public.kb_articles
    set views = views + 1
    where id = p_article
      and deleted_at is null;
$$;

revoke execute on function public.increment_kb_article_views(uuid) from public, anon;
grant execute on function public.increment_kb_article_views(uuid)
  to authenticated, service_role;

-- updated_at só muda quando algo além de views/updated_at muda.
drop trigger if exists kb_articles_set_updated_at on public.kb_articles;
create trigger kb_articles_set_updated_at
  before update on public.kb_articles
  for each row
  when (
    (to_jsonb(old) - 'views' - 'updated_at')
      is distinct from (to_jsonb(new) - 'views' - 'updated_at')
  )
  execute function public.set_updated_at();

-- ============================================================
-- 3) social_settings.updated_at acompanha as alterações
--    (tela de configurações e callback OAuth gravam por upsert)
-- ============================================================
drop trigger if exists social_settings_set_updated_at on public.social_settings;
create trigger social_settings_set_updated_at
  before update on public.social_settings
  for each row execute function public.set_updated_at();

-- Orbit CRM — post do Social só tem como destino contas do próprio cliente
-- A action createSocialPostAction conferia apenas se as contas eram do tenant;
-- o filtro por cliente existia só na tela. Assim, um post do cliente A podia
-- ter como destino a conta do cliente B do mesmo tenant, inclusive por
-- requisição direta à API com o JWT de qualquer membro.
--
-- Regra (a mesma de src/lib/social-accounts.ts): a conta de destino deve ter
-- company_id nulo (conta da agência, serve a qualquer cliente) ou igual ao
-- company_id do post. Linhas já existentes não são revalidadas.

-- 1) Inserir ou trocar o destino de um post.
create or replace function public.social_post_targets_check_company()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_post_company uuid;
  v_account_company uuid;
begin
  select company_id into v_post_company
  from public.social_posts
  where id = new.post_id and tenant_id = new.tenant_id;

  select company_id into v_account_company
  from public.social_accounts
  where id = new.account_id and tenant_id = new.tenant_id;

  if v_account_company is not null
    and v_account_company is distinct from v_post_company then
    raise exception 'a conta de destino pertence a outro cliente'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists social_post_targets_check_company
  on public.social_post_targets;
create trigger social_post_targets_check_company
  before insert or update of post_id, account_id, tenant_id
  on public.social_post_targets
  for each row execute function public.social_post_targets_check_company();

-- 2) Mover um post para outro cliente com destinos de outro cliente.
--    company_id virando nulo (on delete set null da empresa) não é checado.
create or replace function public.social_posts_check_targets_company()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.company_id is not null
    and new.company_id is distinct from old.company_id
    and exists (
      select 1
      from public.social_post_targets t
      join public.social_accounts a
        on a.id = t.account_id and a.tenant_id = t.tenant_id
      where t.post_id = new.id
        and t.tenant_id = new.tenant_id
        and a.company_id is not null
        and a.company_id <> new.company_id
    ) then
    raise exception 'o post tem contas de destino de outro cliente'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists social_posts_check_targets_company on public.social_posts;
create trigger social_posts_check_targets_company
  before update of company_id on public.social_posts
  for each row execute function public.social_posts_check_targets_company();

-- 3) Passar uma conta para um cliente que não é o dos posts que a usam.
--    company_id virando nulo (conta da agência) é sempre permitido.
create or replace function public.social_accounts_check_targets_company()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.company_id is not null
    and new.company_id is distinct from old.company_id
    and exists (
      select 1
      from public.social_post_targets t
      join public.social_posts p
        on p.id = t.post_id and p.tenant_id = t.tenant_id
      where t.account_id = new.id
        and t.tenant_id = new.tenant_id
        and p.deleted_at is null
        and p.company_id is distinct from new.company_id
    ) then
    raise exception 'a conta é destino de posts de outro cliente'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists social_accounts_check_targets_company
  on public.social_accounts;
create trigger social_accounts_check_targets_company
  before update of company_id on public.social_accounts
  for each row execute function public.social_accounts_check_targets_company();

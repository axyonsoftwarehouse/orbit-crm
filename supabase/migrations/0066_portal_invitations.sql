-- Orbit CRM — convite do portal do cliente por e-mail (#48)
-- Antes, "Dar acesso" exigia que a agência digitasse a senha do cliente.
-- Agora a agência cria um convite de uso único (validade de 7 dias) e o
-- cliente define a própria senha em /portal/convite/<token>. O aceite roda no
-- servidor com service role; a equipe (owner/admin) só cria, vê e revoga.

create table public.portal_invitations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  contact_id uuid not null references public.contacts (id) on delete cascade,
  email text not null,
  token uuid not null default gen_random_uuid() unique,
  invited_by uuid references public.profiles (id) on delete set null,
  accepted_at timestamptz,
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now()
);

create index portal_invitations_tenant_idx on public.portal_invitations (tenant_id);
create index portal_invitations_contact_idx on public.portal_invitations (contact_id);

-- O contato precisa ser do mesmo tenant do convite.
create or replace function public.portal_invitation_same_tenant()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.contacts
    where id = new.contact_id and tenant_id = new.tenant_id
  ) then
    raise exception 'contact does not belong to tenant';
  end if;
  return new;
end;
$$;

create trigger portal_invitations_same_tenant
  before insert or update of contact_id, tenant_id on public.portal_invitations
  for each row execute function public.portal_invitation_same_tenant();

revoke execute on function public.portal_invitation_same_tenant() from public, anon, authenticated;

alter table public.portal_invitations enable row level security;

grant select, insert, delete on public.portal_invitations to authenticated;
grant all on public.portal_invitations to service_role;

create policy "portal_invitations_select" on public.portal_invitations
  for select to authenticated
  using (public.has_tenant_role(tenant_id, array['owner', 'admin']) or public.is_super_admin());

create policy "portal_invitations_insert" on public.portal_invitations
  for insert to authenticated
  with check (public.has_tenant_role(tenant_id, array['owner', 'admin']) or public.is_super_admin());

create policy "portal_invitations_delete" on public.portal_invitations
  for delete to authenticated
  using (public.has_tenant_role(tenant_id, array['owner', 'admin']) or public.is_super_admin());

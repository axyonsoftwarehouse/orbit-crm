-- Orbit CRM — links públicos de orçamento e fatura (issue #46)
--
-- Cada envio por e-mail gera um link com token secreto. Só o hash (sha-256)
-- fica aqui; o token existe apenas no e-mail. A página pública (/d/[token])
-- lê pelo service role no servidor, depois de validar o hash: anon não tem
-- acesso à tabela.

create table if not exists public.document_links (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  rel_type text not null check (rel_type in ('estimate', 'invoice')),
  rel_id uuid not null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  last_viewed_at timestamptz,
  responded_at timestamptz
);

create index if not exists document_links_rel_idx
  on public.document_links (tenant_id, rel_type, rel_id);

alter table public.document_links enable row level security;

grant select, insert, update on public.document_links to authenticated;
grant all on public.document_links to service_role;

create policy "document_links_select" on public.document_links
  for select to authenticated
  using (public.is_tenant_member(tenant_id));

create policy "document_links_insert" on public.document_links
  for insert to authenticated
  with check (public.is_tenant_member(tenant_id));

create policy "document_links_update" on public.document_links
  for update to authenticated
  using (public.is_tenant_member(tenant_id))
  with check (public.is_tenant_member(tenant_id));

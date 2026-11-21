-- Orbit CRM — assinatura eletrônica de contrato
--
-- O contrato passa a ter corpo com placeholders, conteúdo congelado no aceite
-- (com hash), prova de aceite (nome, e-mail, data, IP, user agent) e trilha de
-- eventos. O link público usa `document_links` (token + hash), como orçamento
-- e fatura.
--
-- `contract_signers` nasce com uma linha por contrato (`role = 'client'`) e
-- existe para co-assinatura futura sem migração de dados.

alter table public.contracts
  add column if not exists content text,
  add column if not exists content_rendered text,
  add column if not exists content_hash text,
  add column if not exists signed_at timestamptz,
  add column if not exists signature_path text,
  add column if not exists acceptance_firstname text,
  add column if not exists acceptance_lastname text,
  add column if not exists acceptance_email text,
  add column if not exists acceptance_ip text,
  add column if not exists acceptance_user_agent text,
  add column if not exists marked_as_signed_at timestamptz,
  add column if not exists marked_as_signed_by uuid references public.profiles (id) on delete set null,
  add column if not exists last_sent_at timestamptz,
  add column if not exists last_sign_reminder_at timestamptz,
  add column if not exists require_login boolean not null default false;

alter table public.tenants
  add column if not exists e_sign_legal_text text;

create table if not exists public.contract_signers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  contract_id uuid not null,
  role text not null default 'client' check (role in ('client', 'company')),
  name text,
  email text,
  signed_at timestamptz,
  signature_path text,
  ip text,
  user_agent text,
  created_at timestamptz not null default now(),
  constraint contract_signers_contract_fk foreign key (contract_id, tenant_id)
    references public.contracts (id, tenant_id) on delete cascade
);

create index if not exists contract_signers_contract_idx
  on public.contract_signers (tenant_id, contract_id);

create table if not exists public.contract_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  contract_id uuid not null,
  kind text not null check (
    kind in ('created', 'sent', 'viewed', 'signed', 'unsigned', 'marked_signed', 'reminder')
  ),
  actor_kind text not null check (actor_kind in ('staff', 'client', 'system')),
  actor_id uuid,
  ip text,
  user_agent text,
  metadata jsonb,
  created_at timestamptz not null default now(),
  constraint contract_events_contract_fk foreign key (contract_id, tenant_id)
    references public.contracts (id, tenant_id) on delete cascade
);

create index if not exists contract_events_contract_idx
  on public.contract_events (tenant_id, contract_id, created_at desc);

-- Link público de contrato: mesma tabela de orçamento/fatura.
alter table public.document_links
  drop constraint if exists document_links_rel_type_check;
alter table public.document_links
  add constraint document_links_rel_type_check
  check (rel_type in ('estimate', 'invoice', 'contract'));

grant select on public.contract_signers to authenticated;
grant all on public.contract_signers to service_role;
grant all on public.contract_signers to postgres;

grant select on public.contract_events to authenticated;
grant all on public.contract_events to service_role;
grant all on public.contract_events to postgres;

alter table public.contract_signers enable row level security;
alter table public.contract_events enable row level security;

create policy "contract_signers_select" on public.contract_signers
  for select to authenticated using (public.is_tenant_member(tenant_id));

create policy "contract_events_select" on public.contract_events
  for select to authenticated using (public.is_tenant_member(tenant_id));

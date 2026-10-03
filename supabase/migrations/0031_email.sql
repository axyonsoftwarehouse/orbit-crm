-- Orbit CRM — F15: Modelos de e-mail e histórico de envios

create table if not exists public.email_templates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  key text not null,
  subject text not null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, key)
);

create index if not exists email_templates_tenant_idx
  on public.email_templates (tenant_id);

drop trigger if exists email_templates_set_updated_at on public.email_templates;
create trigger email_templates_set_updated_at
  before update on public.email_templates
  for each row execute function public.set_updated_at();

create table if not exists public.email_log (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  to_email text not null,
  subject text not null,
  template_key text,
  status text not null default 'sent' check (status in ('sent', 'skipped', 'error')),
  error text,
  created_at timestamptz not null default now()
);

create index if not exists email_log_tenant_idx
  on public.email_log (tenant_id, created_at desc);

grant select, insert, update, delete on public.email_templates to authenticated;
grant select, insert on public.email_log to authenticated;
grant all on public.email_templates to service_role;
grant all on public.email_templates to postgres;
grant all on public.email_log to service_role;
grant all on public.email_log to postgres;

alter table public.email_templates enable row level security;
alter table public.email_log enable row level security;

create policy "email_templates_select" on public.email_templates
  for select to authenticated using (public.is_tenant_member(tenant_id));
create policy "email_templates_insert" on public.email_templates
  for insert to authenticated
  with check (public.has_tenant_role(tenant_id, array['owner', 'admin']));
create policy "email_templates_update" on public.email_templates
  for update to authenticated
  using (public.has_tenant_role(tenant_id, array['owner', 'admin']))
  with check (public.has_tenant_role(tenant_id, array['owner', 'admin']));
create policy "email_templates_delete" on public.email_templates
  for delete to authenticated
  using (public.has_tenant_role(tenant_id, array['owner', 'admin']));

create policy "email_log_select" on public.email_log
  for select to authenticated using (public.is_tenant_member(tenant_id));
create policy "email_log_insert" on public.email_log
  for insert to authenticated with check (public.is_tenant_member(tenant_id));

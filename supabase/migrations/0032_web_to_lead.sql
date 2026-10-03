-- Orbit CRM — F16: Web-to-lead (formulário público de captação)

alter table public.tenants
  add column if not exists web_to_lead_enabled boolean not null default false,
  add column if not exists web_to_lead_source_id uuid;

alter table public.tenants drop constraint if exists tenants_web_to_lead_source_fk;
alter table public.tenants
  add constraint tenants_web_to_lead_source_fk foreign key (web_to_lead_source_id)
  references public.lead_sources (id) on delete set null;

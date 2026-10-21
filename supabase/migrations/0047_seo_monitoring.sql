-- Orbit CRM — SEO: monitoramento agendado por site

alter table public.seo_sites
  add column if not exists check_interval_days integer not null default 0
    check (check_interval_days in (0, 1, 7, 30)),
  add column if not exists next_audit_at timestamptz;

create index if not exists seo_sites_due_idx
  on public.seo_sites (next_audit_at)
  where deleted_at is null and check_interval_days > 0;

-- Mantem o agendamento consistente ao criar/alterar o site.
create or replace function public.set_seo_next_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.check_interval_days > 0 then
    new.next_audit_at = coalesce(
      new.next_audit_at,
      now() + make_interval(days => new.check_interval_days)
    );
  else
    new.next_audit_at = null;
  end if;

  return new;
end;
$$;

drop trigger if exists seo_sites_set_next_audit on public.seo_sites;
create trigger seo_sites_set_next_audit
  before insert or update of check_interval_days, next_audit_at
  on public.seo_sites
  for each row execute function public.set_seo_next_audit();

revoke execute on function public.set_seo_next_audit() from public, anon;
grant execute on function public.set_seo_next_audit()
  to authenticated, service_role;

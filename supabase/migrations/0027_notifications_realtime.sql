-- Orbit CRM — Notificações em tempo real + preferência de e-mail no perfil

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;

alter table public.profiles
  add column if not exists notify_email boolean not null default true;

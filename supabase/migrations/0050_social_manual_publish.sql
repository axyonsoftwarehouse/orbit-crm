-- Orbit CRM — Social: modo manual de publicação e lembretes

alter table public.social_posts
  add column if not exists manual_reminder_sent_at timestamptz;

alter table public.social_settings
  add column if not exists publish_mode text not null default 'manual'
    check (publish_mode in ('manual', 'provider'));

create index if not exists social_posts_manual_due_idx
  on public.social_posts (scheduled_at)
  where status = 'scheduled'
    and deleted_at is null
    and manual_reminder_sent_at is null;

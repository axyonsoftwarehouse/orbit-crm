-- Atividade do lead com tipo (ligação, reunião, e-mail, WhatsApp, nota) e
-- "próximo passo" (data/hora + nota). O cron diário avisa o responsável no
-- dia e marca next_step_reminded_at para não repetir.

alter table public.lead_activities
  add column if not exists type text not null default 'note',
  add column if not exists next_step_at timestamptz,
  add column if not exists next_step_note text,
  add column if not exists next_step_done_at timestamptz,
  add column if not exists next_step_reminded_at timestamptz;

alter table public.lead_activities
  drop constraint if exists lead_activities_type_check;
alter table public.lead_activities
  add constraint lead_activities_type_check
  check (type in ('note', 'call', 'meeting', 'email', 'whatsapp'));

alter table public.lead_activities
  drop constraint if exists lead_activities_next_step_note_len;
alter table public.lead_activities
  add constraint lead_activities_next_step_note_len
  check (next_step_note is null or char_length(next_step_note) <= 500);

-- Próximos passos em aberto (painel, calendário e cron).
create index if not exists lead_activities_open_next_step_idx
  on public.lead_activities (tenant_id, next_step_at)
  where next_step_at is not null and next_step_done_at is null;

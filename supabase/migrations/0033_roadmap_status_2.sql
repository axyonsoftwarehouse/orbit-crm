-- Orbit CRM — Atualiza status do roadmap (fases entregues F12–F16)

update public.roadmap_items
set status = 'done'
where title in (
  'Calendário',
  'Metas / goals de vendas',
  'Log de atividades / auditoria',
  'Formulários de captação de lead (web-to-lead)',
  'Modelos de e-mail editáveis',
  'Notificações em tempo real e preferências'
);

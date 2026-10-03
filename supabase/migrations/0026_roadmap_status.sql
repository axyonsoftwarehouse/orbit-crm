-- Orbit CRM — Atualiza status dos itens já entregues no roadmap

update public.roadmap_items
set status = 'done'
where title in (
  'Paginação e ordenação nas listas',
  'Tipagem do banco (database.types)',
  'Importação CSV de clientes e leads',
  'Despesas',
  'Contratos'
);

update public.roadmap_items
set status = 'in_progress'
where title in (
  'Exportação CSV/PDF dos registros',
  'Observabilidade (Sentry + Analytics)'
);

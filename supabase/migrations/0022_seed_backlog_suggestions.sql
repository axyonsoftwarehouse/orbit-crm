-- Orbit CRM — Sugestões de melhorias/feature (registradas no roadmap)

insert into public.roadmap_items
  (title, description, category, module, origin, status, priority)
select * from (
  values
    ('Paginação e ordenação nas listas',
     'Listas (clientes, projetos, tarefas, faturas, orçamentos, leads, tickets, timesheet) hoje carregam tudo; adicionar paginação e ordenação por coluna.',
     'improvement', 'core', 'Sugestões', 'backlog', 1),
    ('Tipagem do banco (database.types)',
     'Gerar tipos do Supabase e tipar os clients para eliminar casts manuais e pegar erros de schema em compile-time.',
     'improvement', 'platform', 'Sugestões', 'backlog', 2),
    ('Exportação CSV/PDF dos registros',
     'Exportar faturas, orçamentos, timesheet e relatórios em CSV/PDF.',
     'feature', 'platform', 'Sugestões', 'backlog', 3),
    ('Importação CSV de clientes e leads',
     'Importar clientes e leads a partir de CSV com mapeamento de colunas.',
     'feature', 'platform', 'Sugestões', 'backlog', 3),
    ('Histórico de envios de e-mail',
     'Registrar envios (destinatário, assunto, status, erro) e reenviar.',
     'improvement', 'platform', 'Sugestões', 'backlog', 3),
    ('Anexos: preview, upload múltiplo e validação',
     'Preview inline (imagem/PDF), upload de múltiplos arquivos e validação de tipo/tamanho no servidor.',
     'improvement', 'platform', 'Sugestões', 'backlog', 3),
    ('Notificações em tempo real e preferências',
     'Notificações via Supabase Realtime e preferências por usuário/tipo.',
     'feature', 'platform', 'Sugestões', 'backlog', 3),
    ('Enforcement de plano em tags/campos/marcos/armazenamento',
     'Aplicar limites de plano também a tags, campos personalizados, marcos e storage, com painel de consumo.',
     'improvement', 'platform', 'Sugestões', 'backlog', 3),
    ('Timesheet: aprovação de horas',
     'Fluxo de aprovação de apontamentos antes de faturar.',
     'feature', 'core', 'Sugestões', 'backlog', 3),
    ('Busca global estilo command palette',
     'Atalhos (Cmd/Ctrl+K), escopo por entidade e navegação rápida.',
     'improvement', 'platform', 'Sugestões', 'backlog', 4),
    ('Observabilidade (Sentry + Analytics)',
     'Integrar Sentry e Vercel Analytics e logs estruturados (previsto no plano, ainda pendente).',
     'improvement', 'platform', 'Sugestões', 'backlog', 2),
    ('CI no GitHub Actions',
     'Pipeline com lint, typecheck, unit, RLS e e2e em PRs.',
     'improvement', 'platform', 'Sugestões', 'backlog', 2),
    ('Testes de RLS em banco local',
     'Rodar os testes de isolamento contra Supabase local (resolver conflito de portas do Docker) em vez do remoto.',
     'improvement', 'platform', 'Sugestões', 'backlog', 2),
    ('Otimizar queries e equipe (evitar listUsers)',
     'Guardar e-mail em profiles (trigger) ou usar RPC para evitar admin.listUsers(perPage 200); revisar N+1 em projetos/tarefas.',
     'improvement', 'core', 'Sugestões', 'backlog', 3)
) as t(title, description, category, module, origin, status, priority)
where not exists (
  select 1 from public.roadmap_items r where r.title = t.title
);

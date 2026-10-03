-- Orbit CRM — Registro de roadmap/backlog da plataforma
-- Fonte única para features/melhorias adiadas (fora do MVP) ou planejadas.
-- Acesso restrito ao super-admin; futura tela em /plataforma.

create table if not exists public.roadmap_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text not null default 'feature'
    check (category in ('feature', 'improvement', 'bug', 'docs')),
  module text,
  origin text,
  status text not null default 'backlog'
    check (status in ('backlog', 'planned', 'in_progress', 'done', 'wont_do')),
  priority smallint not null default 3
    check (priority between 1 and 4), -- 1 crítica, 2 alta, 3 média, 4 baixa
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists roadmap_items_status_idx
  on public.roadmap_items (status, priority);
create index if not exists roadmap_items_module_idx
  on public.roadmap_items (module);

drop trigger if exists roadmap_items_set_updated_at on public.roadmap_items;
create trigger roadmap_items_set_updated_at
  before update on public.roadmap_items
  for each row execute function public.set_updated_at();

grant select, insert, update, delete on public.roadmap_items to authenticated;
grant all on public.roadmap_items to service_role;
grant all on public.roadmap_items to postgres;

alter table public.roadmap_items enable row level security;

drop policy if exists "roadmap_items_select" on public.roadmap_items;
create policy "roadmap_items_select" on public.roadmap_items
  for select to authenticated using (public.is_super_admin());

drop policy if exists "roadmap_items_insert" on public.roadmap_items;
create policy "roadmap_items_insert" on public.roadmap_items
  for insert to authenticated with check (public.is_super_admin());

drop policy if exists "roadmap_items_update" on public.roadmap_items;
create policy "roadmap_items_update" on public.roadmap_items
  for update to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

drop policy if exists "roadmap_items_delete" on public.roadmap_items;
create policy "roadmap_items_delete" on public.roadmap_items
  for delete to authenticated using (public.is_super_admin());

-- Carga inicial (apenas se a tabela estiver vazia)
insert into public.roadmap_items
  (title, description, category, module, origin, status, priority)
select * from (
  values
    -- Adiados no F7 (marcos + Gantt)
    ('Gantt interativo (drag para reagendar)',
     'Permitir arrastar barras de tarefas e marcos no cronograma para atualizar as datas.',
     'feature', 'projects', 'F7', 'backlog', 3),
    ('Dependências entre tarefas no Gantt',
     'Vínculos predecessor/sucessora (finish-to-start) e destaque de caminho crítico.',
     'feature', 'projects', 'F7', 'backlog', 3),
    ('Controles de escala do Gantt',
     'Alternar visualização por dia/semana/mês e zoom no cronograma.',
     'improvement', 'projects', 'F7', 'backlog', 4),
    ('Visão de portfólio global do Gantt',
     'Cronograma consolidado de todos os projetos do tenant, com filtros.',
     'feature', 'projects', 'F7', 'backlog', 3),
    ('Gantt no portal do cliente',
     'Exibir o cronograma do projeto (somente leitura) para o cliente.',
     'feature', 'portal', 'F7', 'backlog', 3),
    ('Marcos editáveis no portal do cliente',
     'Permitir que o cliente acompanhe/atualize status de marcos quando aplicável.',
     'improvement', 'portal', 'F7', 'backlog', 4),
    ('Templates/duplicação de marcos e projetos',
     'Modelos de projeto com marcos e tarefas pré-definidas para reuso.',
     'feature', 'projects', 'F7', 'backlog', 4),

    -- Adiados no F8 (tags + campos personalizados)
    ('Tags no portal do cliente',
     'Exibir tags dos registros no portal (somente leitura).',
     'feature', 'portal', 'F8', 'backlog', 4),
    ('Campos personalizados no portal do cliente',
     'Exibir valores de campos personalizados no portal, com controle de visibilidade por campo.',
     'feature', 'portal', 'F8', 'backlog', 3),
    ('Tipos extras de campo personalizado',
     'URL, moeda, e-mail, telefone e multisseleção além dos tipos do MVP.',
     'feature', 'platform', 'F8', 'backlog', 4),
    ('Filtro e relatórios por tags e campos personalizados',
     'Filtrar listas e montar relatórios a partir de tags e campos personalizados.',
     'feature', 'reports', 'F8', 'backlog', 3),
    ('Campos personalizados em mais entidades',
     'Estender para tickets, orçamentos e faturas.',
     'feature', 'platform', 'F8', 'backlog', 4),
    ('Tags em mais entidades',
     'Estender tags para orçamentos e faturas.',
     'improvement', 'platform', 'F8', 'backlog', 4),
    ('Regras de campos personalizados',
     'Obrigatoriedade condicional e visibilidade condicional por valor de outro campo.',
     'feature', 'platform', 'F8', 'backlog', 4),
    ('Importação/exportação CSV de campos personalizados',
     'Importar e exportar valores de campos personalizados.',
     'feature', 'platform', 'F8', 'backlog', 4),
    ('Templates de campos personalizados por segmento',
     'Conjuntos pré-definidos de campos por tipo de negócio.',
     'feature', 'platform', 'F8', 'backlog', 4),

    -- Módulos futuros (referência Perfex / PLANO §5)
    ('Despesas',
     'Despesas do tenant e despesas faturáveis por cliente/projeto.',
     'feature', 'finance', 'Perfex', 'backlog', 3),
    ('Contratos',
     'Contratos com vigência, renovação e assinatura.',
     'feature', 'contracts', 'Perfex', 'backlog', 4),
    ('Metas / goals de vendas',
     'Metas por responsável/período e acompanhamento no dashboard.',
     'feature', 'crm', 'Perfex', 'backlog', 4),
    ('Propostas comerciais',
     'Propostas (distintas de orçamentos) com aceite online.',
     'feature', 'finance', 'Perfex', 'backlog', 4),
    ('Notas de crédito / reembolsos',
     'Emissão de notas de crédito e reembolso de pagamentos.',
     'feature', 'finance', 'Perfex', 'backlog', 4),
    ('Faturas recorrentes / assinaturas',
     'Geração automática de faturas por recorrência.',
     'feature', 'finance', 'Perfex', 'backlog', 3),
    ('Formulários de captação de lead (web-to-lead)',
     'Formulário público que cria leads com origem rastreada.',
     'feature', 'crm', 'Perfex', 'backlog', 4),
    ('Pesquisas (surveys)',
     'Pesquisas de satisfação vinculadas a tickets.',
     'feature', 'platform', 'Perfex', 'backlog', 4),
    ('Anúncios (announcements)',
     'Anúncios internos e para o portal do cliente.',
     'feature', 'platform', 'Perfex', 'backlog', 4),
    ('Calendário',
     'Calendário com tarefas, eventos e prazos.',
     'feature', 'platform', 'Perfex', 'backlog', 4),
    ('Modelos de e-mail editáveis',
     'Editor de templates de e-mail por tipo de notificação.',
     'feature', 'platform', 'Perfex', 'backlog', 4),
    ('Relatórios adicionais',
     'Despesas, produtividade e leads por origem.',
     'feature', 'reports', 'Perfex', 'backlog', 4),
    ('Log de atividades / auditoria',
     'Registro de ações por usuário e trilha de auditoria.',
     'feature', 'platform', 'Perfex', 'backlog', 4),
    ('Pagamento online de faturas pelo portal',
     'Gateway de pagamento para o cliente quitar faturas no portal.',
     'feature', 'finance', 'Perfex', 'backlog', 3),
    ('Multi-moeda e impostos configuráveis',
     'Suporte a múltiplas moedas e regras de imposto por item.',
     'feature', 'platform', 'Perfex', 'backlog', 4),
    ('Permissões granulares',
     'Permissões por papel e por campo, além de owner/admin/member.',
     'feature', 'platform', 'Perfex', 'backlog', 4),
    ('Autenticação 2FA',
     'Segundo fator para login interno e do portal.',
     'feature', 'platform', 'Perfex', 'backlog', 4),
    ('API pública + webhooks',
     'API para integrações e webhooks de eventos do CRM.',
     'feature', 'platform', 'Perfex', 'backlog', 4),
    ('Self-signup / onboarding e domínio wildcard',
     'Ativar cadastro self-service e o subdomínio por tenant (F6.2 já pronto, inativo).',
     'improvement', 'platform', 'F6', 'backlog', 3),
    ('Cobrança automática',
     'Assinaturas recorrentes com gateway (Stripe/Asaas) e baixa automática.',
     'feature', 'platform', 'F6', 'planned', 2)
) as t(title, description, category, module, origin, status, priority)
where not exists (select 1 from public.roadmap_items);

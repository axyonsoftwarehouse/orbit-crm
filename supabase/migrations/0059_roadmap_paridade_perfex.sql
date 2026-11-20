-- Orbit CRM — itens de roadmap vindos do cruzamento com o Perfex CRM 3.4.1
-- Fonte: docs/paridade-perfex-3.4.1.md (levantamento de 20/11/2026).
-- Só entram aqui as lacunas que ainda NÃO tinham item no roadmap; propostas,
-- notas de crédito, recorrência, multi-moeda, permissões, 2FA, API, surveys e
-- anúncios já existem em 0017/0022.
-- Idempotente por título: rodar de novo não duplica.

insert into public.roadmap_items
  (title, description, category, module, origin, status, priority)
select *
from (
  values
    ('Catálogo de itens e serviços',
     'Cadastro reutilizável de produtos/serviços com grupo, descrição, preço, unidade e imposto; orçamentos e faturas passam a escolher do catálogo em vez de digitar a linha. No Perfex: Admin > Items, tabelas tblitems/tblitems_groups.',
     'feature', 'finance', 'Paridade Perfex 3.4.1', 'backlog', 2),
    ('Assinatura eletrônica de contratos',
     'Coletar aceite no portal com registro de nome, e-mail, data/hora e IP, e marcar o contrato como assinado. No Perfex: Contracts signature + Settings > E-sign, com confirmação de identidade.',
     'feature', 'contracts', 'Paridade Perfex 3.4.1', 'backlog', 2),
    ('Contrato: anexos, comentários e PDF',
     'Anexar arquivos ao contrato, comentar e gerar PDF do contrato. Hoje `attachments` e `comments` aceitam apenas task/project/ticket.',
     'improvement', 'contracts', 'Paridade Perfex 3.4.1', 'backlog', 3),
    ('Discussões e notas internas do projeto',
     'Threads de discussão e notas privadas da equipe dentro do projeto, separadas dos comentários por tarefa. No Perfex: tblprojectdiscussions e tblproject_notes.',
     'feature', 'projects', 'Paridade Perfex 3.4.1', 'backlog', 2),
    ('Respostas predefinidas e serviços de ticket',
     'Cadastro de respostas prontas e de serviços (tipo de atendimento) para agilizar o ticket. No Perfex: tickets/predefined_replies e tickets/services.',
     'feature', 'support', 'Paridade Perfex 3.4.1', 'backlog', 3),
    ('Newsfeed interno da equipe',
     'Mural da equipe com posts, curtidas e comentários, independente de projetos. No Perfex: Admin > Newsfeed (tblnewsfeed_posts/comments/likes).',
     'feature', 'platform', 'Paridade Perfex 3.4.1', 'backlog', 3),
    ('Categorias de despesa e modos de pagamento configuráveis',
     'Trocar os campos de texto livre (`expenses.category` e `payments.payment_mode`) por catálogos por tenant, com relatório por categoria e por forma de pagamento.',
     'improvement', 'finance', 'Paridade Perfex 3.4.1', 'backlog', 3),
    ('Múltiplos responsáveis e seguidores em tarefas',
     'Permitir mais de um responsável por tarefa e "seguir" tarefa para receber notificações. Hoje `tasks.assignee_id` é único; o Perfex usa tbltask_assigned e tbltask_followers.',
     'feature', 'projects', 'Paridade Perfex 3.4.1', 'backlog', 3),
    ('Extrato do cliente (statement)',
     'Extrato consolidado por cliente (faturas, pagamentos, saldo) em tela e PDF, útil para cobrança e fechamento. No Perfex: Clients > Statement.',
     'feature', 'finance', 'Paridade Perfex 3.4.1', 'backlog', 3),
    ('Portal: edição de perfil, empresa e contatos',
     'Deixar o contato do portal editar os próprios dados, os dados da empresa e (quando primário) os contatos. Hoje o portal é somente leitura.',
     'improvement', 'portal', 'Paridade Perfex 3.4.1', 'backlog', 3),
    ('Cofre de senhas do cliente (vault)',
     'Guardar credenciais de acesso do cliente (site, hospedagem, redes) com visibilidade restrita. No Perfex: Clients > Vault (tblvault).',
     'feature', 'crm', 'Paridade Perfex 3.4.1', 'backlog', 4),
    ('Grupos de clientes',
     'Segmentar clientes em grupos para filtro, relatório e preço/condição. No Perfex: Clientes > Grupos (tblcustomer_groups).',
     'feature', 'crm', 'Paridade Perfex 3.4.1', 'backlog', 4),
    ('E-mail piping e integração IMAP de leads',
     'Criar ticket a partir de e-mail recebido e importar leads de uma caixa IMAP. No Perfex: pipe.php e Leads > Email Integration.',
     'feature', 'support', 'Paridade Perfex 3.4.1', 'backlog', 4)
) as t(title, description, category, module, origin, status, priority)
where not exists (
  select 1
  from public.roadmap_items r
  where r.title = t.title
);

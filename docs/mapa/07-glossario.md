# 7. Glossário

> Termos usados no código do Orbit CRM que um leigo não saberia. Estado: `main@29aac19`.

| Termo | Significado |
|---|---|
| **tenant** | Uma empresa/workspace dentro do SaaS. Toda tabela de negócio tem `tenant_id`. |
| **membership** | Vínculo entre um usuário e um tenant, com um papel (`owner`/`admin`/`member`) e status (`active`/`invited`/`disabled`). Um usuário pode ter vários. |
| **papel (role)** | `owner` > `admin` > `member`. Define o que a pessoa pode fazer; `isManager` = owner ou admin. |
| **super-admin** | Usuário com `profiles.is_super_admin`; acessa `/plataforma` e ignora RLS pela flag. |
| **RLS (Row Level Security)** | Recurso do Postgres que esconde linhas por linha conforme a sessão do banco. É o que isola os tenants. |
| **policy** | Regra de RLS ligada a uma tabela (ex.: "só membros do tenant enxergam a linha"). |
| **security definer** | Função SQL que roda com os privilégios do dono (ignora RLS internamente). Usada para `is_tenant_member`, `has_tenant_role`, `is_super_admin` e as RPCs do portal. |
| **RPC** | Função Postgres chamada pelo app via `supabase.rpc(...)`. Ex.: `next_document_number`, `client_respond_estimate`, `check_rate_limit`. |
| **server action** | Função do Next.js marcada com `"use server"`; roda no servidor, valida com Zod e é chamada pelo formulário. Ficam em `src/server/actions/`. |
| **RSC (React Server Component)** | Componente que roda no servidor e busca dados direto (as páginas do app). |
| **anon key / service role** | Chaves do Supabase. A **anon** é do navegador e respeita a RLS; a **service role** ignora a RLS e só é usada no servidor (jobs e fluxos administrativos). |
| **órfã de import** | Arquivo que existe no projeto mas nenhum outro importa (ex.: `src/lib/env.ts`). |
| **soft delete** | Exclusão lógica: em vez de apagar, preenche `deleted_at`. O app filtra `.is("deleted_at", null)`. |
| **`next_document_number`** | RPC que gera o próximo número sequencial de um documento **por tenant** (`estimate`, `invoice`, `ticket`). |
| **`formatted_number`** | Número do documento já formatado com o prefixo do tenant (ex.: `INV-000123`). |
| **document_items** | Tabela polimórfica que guarda os itens de um orçamento ou de uma fatura (`rel_type` + `rel_id`). |
| **estimate (orçamento)** | Proposta com itens, desconto e imposto. Status 1–5: rascunho, enviado, recusado, aceito, expirado. Converte-se em fatura. |
| **invoice (fatura)** | Cobrança. Status 1–6: em aberto, pago, parcial, cancelada, rascunho. O status é derivado dos pagamentos. |
| **timesheet / time_entry** | Apontamento de horas (timer ou lançamento manual). Guarda `duration_seconds`, `is_billable` e `rate` (valor-hora). |
| **billing_type** | Forma de cobrança do projeto: 1 valor fixo, 2 por hora (projeto), 3 por hora (tarefa). Decide de onde vem o `rate`. |
| **milestone (marco)** | Ponto de entrega do projeto (status 1–3); tarefas podem ser vinculadas a um marco. |
| **Gantt / cronograma** | Linha do tempo do projeto onde as tarefas viram barras arrastáveis/redimensionáveis. |
| **task_dependency** | Dependência entre tarefas (predecessora → sucessora) usada no Gantt para deslocar sucessoras. |
| **lead** | Oportunidade comercial no funil (CRM). Tem status configurável (incluindo "ganho"/"perdido") e origens. |
| **web-to-lead** | Formulário público (`/f/[slug]`) que cria leads diretamente no tenant. |
| **honeypot** | Campo escondido no formulário público (`company_website`); se preenchido, presume-se bot. |
| **rate limit** | Limite de tentativas por IP/janela, via RPC `check_rate_limit` sobre a tabela `rate_limit_hits`. |
| **ticket** | Chamado de suporte (número `TCK-`), com prioridade, tipo, departamento e respostas (`ticket_replies`). |
| **KB / FAQ** | Base de conhecimento (`kb_categories`, `kb_articles`) e perguntas frequentes (`faqs`) do atendimento. |
| **portal do cliente** | Área `/portal` acessada por um `contacts.user_id`; somente leitura + aprovação de orçamento e abertura de tickets. |
| **plan limits** | Limites por recurso definidos no plano do tenant (`plans.limits`), checados por `check_plan_limit`. |
| **branding** | Cor primária e logo do tenant, aplicados como CSS vars no `/app`. Bucket público `branding`. |
| **bucket (Storage)** | Container de arquivos do Supabase. `attachments` é privado (URL assinada) e `branding` é público. |
| **revalidatePath** | Função do Next que invalida o cache de uma rota após uma mutação. |
| **Realtime** | Canal do Supabase que entrega mudanças ao navegador (usado na tabela `notifications`). |
| **TanStack Query** | Biblioteca de cache/estado para dados no cliente (usada em telas interativas, ex.: timer). |
| **Zod** | Biblioteca de validação de schemas; cada `src/lib/validations/*.ts` define o formato de uma entrada. |
| **shadcn / base-ui** | Base de componentes de UI. `src/components/ui` são primitivos gerados sobre `@base-ui/react`, com `cva` para variantes. |
| **`@/*`** | Alias de import que aponta para `src/*` (`tsconfig.json`). |
| **cron** | Tarefa agendada. Aqui é a Vercel chamando `/api/cron/reminders` às 09:00 (`vercel.json`). |

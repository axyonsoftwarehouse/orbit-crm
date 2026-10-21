# Spec â€” MÃ³dulo de Social Media do Orbit CRM

> Status: rascunho para implementaÃ§Ã£o
> VersÃ£o: 0.1
> Data: outubro/2026
> Produto: Orbit CRM
> ReferÃªncias analisadas: Stackposts v10.0, SocialVibe v2.1.0, Mingle SAAS v5.5.8, BeePost v2.2 e QuickPost v1.0

## 1. Objetivo

Adicionar ao Orbit um mÃ³dulo de **gestÃ£o de redes sociais** para agÃªncias e prestadores de serviÃ§o, integrado ao cliente, ao projeto e ao portal do cliente.

O mÃ³dulo deve permitir:

- conectar contas sociais por cliente;
- criar posts com texto, mÃ­dia e mÃºltiplas redes;
- agendar, publicar e reagendar;
- enviar posts para aprovaÃ§Ã£o do cliente no portal;
- acompanhar status, falhas e histÃ³rico;
- gerar conteÃºdo com IA;
- consultar mÃ©tricas bÃ¡sicas por post/rede.

A implementaÃ§Ã£o serÃ¡ **nativa em Next.js + Supabase**. Os projetos de referÃªncia servem apenas como mapa de features e UX; nenhum cÃ³digo, SQL, asset ou layout serÃ¡ copiado.

## 2. DecisÃµes de produto

| Tema            | DecisÃ£o                                                                   |
| --------------- | -------------------------------------------------------------------------- |
| Posicionamento  | MÃ³dulo **Social** dentro do Orbit, opcional por plano                     |
| IntegraÃ§Ãµes   | Agregador de redes sociais no MVP; OAuth nativo sÃ³ depois                 |
| PublicaÃ§Ã£o    | Staff cria/agenda; cliente aprova no portal                                |
| AprovaÃ§Ã£o     | ObrigatÃ³ria por padrÃ£o para posts de cliente; owner/admin pode desativar |
| Redes iniciais  | LinkedIn (perfil/pÃ¡gina), Instagram (business), Facebook Pages e X        |
| Redes seguintes | TikTok, Threads, YouTube, Pinterest, Google Business                       |
| Fuso horÃ¡rio   | Armazenar UTC; UI converte para o fuso do navegador no MVP                 |
| MÃ­dia          | Supabase Storage privado + URLs assinadas/upload para o agregador          |
| Analytics       | Fase 2; snapshots diÃ¡rios, sem prometer tempo real                        |
| IA              | Fase 2; OpenAI via chave do servidor, com limite por plano                 |
| Multi-tenant    | `tenant_id` em todas as tabelas + RLS                                      |

### 2.1 Matriz de referências → Orbit

| Capacidade               | Referência principal              | Fase no Orbit |
| ------------------------ | --------------------------------- | ------------- |
| Contas e OAuth           | Stackposts, SocialVibe            | Fase 1        |
| Compositor multi-rede    | Stackposts, Mingle                | Fase 1        |
| Calendário               | Stackposts, Mingle                | Fase 1        |
| Aprovação                | Stackposts                        | Fase 1        |
| Fila/retry de publicação | Stackposts, BeePost               | Fase 1        |
| Times e permissões       | Stackposts, SocialVibe            | Fase 1        |
| IA para legenda/imagem   | Stackposts, QuickPost, SocialVibe | Fase 2        |
| Analytics                | Mingle, Stackposts                | Fase 2        |
| RSS e posts recorrentes  | Stackposts                        | Fase 2        |
| Relatório white-label    | Stackposts                        | Fase 2        |
| Inbox/comentários        | Stackposts, Mingle                | Fase 3        |
| Social listening         | Stackposts                        | Fase 3        |

## 3. Escopo do MVP

### 3.1 IncluÃ­do

- Contas sociais por cliente/tenant.
- Compositor de post com preview por rede.
- MÃºltiplas redes e mÃºltiplas contas por post.
- Rascunho, envio para aprovaÃ§Ã£o, aprovaÃ§Ã£o, agendamento, publicaÃ§Ã£o e falha.
- CalendÃ¡rio mensal e lista de posts.
- Fila de publicaÃ§Ã£o com retry e idempotÃªncia.
- Portal do cliente para aprovar/rejeitar posts.
- NotificaÃ§Ãµes internas e por e-mail.
- Auditoria de criaÃ§Ã£o/aprovaÃ§Ã£o/publicaÃ§Ã£o.
- Limites de plano: contas, posts/mÃªs e armazenamento.
- ExportaÃ§Ã£o CSV do histÃ³rico.

### 3.2 Fora do MVP

- Caixa de entrada/DMs/comentÃ¡rios.
- Social listening.
- GestÃ£o de anÃºncios.
- OAuth nativo de todas as redes.
- Analytics avanÃ§ado e relatÃ³rios white-label.
- AprovaÃ§Ã£o em mÃºltiplas etapas.
- Fluxo de agÃªncia com subclientes.
- PublicaÃ§Ã£o de stories/reels com recursos especÃ­ficos de cada rede.
- Agendamento recorrente e RSS (fase 2).

## 4. Personas e papÃ©is

| Papel             | Pode                                                                     |
| ----------------- | ------------------------------------------------------------------------ |
| `owner`           | tudo no tenant, incluindo conectar contas e configurar aprovaÃ§Ã£o       |
| `admin`           | tudo do owner, exceto transferir propriedade                             |
| `member`          | criar/editar rascunhos, enviar para aprovaÃ§Ã£o, ver posts e calendÃ¡rio |
| Cliente do portal | ver posts do prÃ³prio cliente, aprovar/rejeitar, acompanhar status       |

### 4.1 Matriz de permissÃµes

| AÃ§Ã£o                            | Owner | Admin | Member | Cliente                   |
| --------------------------------- | ----- | ----- | ------ | ------------------------- |
| Conectar/desconectar conta social | Sim   | Sim   | NÃ£o   | NÃ£o                      |
| Criar/editar rascunho             | Sim   | Sim   | Sim    | NÃ£o                      |
| Excluir rascunho de outro autor   | Sim   | Sim   | NÃ£o   | NÃ£o                      |
| Enviar para aprovaÃ§Ã£o           | Sim   | Sim   | Sim    | NÃ£o                      |
| Aprovar/rejeitar internamente     | Sim   | Sim   | NÃ£o   | NÃ£o                      |
| Aprovar/rejeitar no portal        | â€”   | â€”   | â€”    | Sim                       |
| Agendar/publicar                  | Sim   | Sim   | NÃ£o   | NÃ£o                      |
| Reagendar/cancelar                | Sim   | Sim   | NÃ£o   | NÃ£o                      |
| Ver mÃ©tricas                     | Sim   | Sim   | Sim    | Sim (do prÃ³prio cliente) |
| Configurar IA e aprovaÃ§Ã£o       | Sim   | Sim   | NÃ£o   | NÃ£o                      |

## 5. Jornadas principais

### 5.1 Conectar conta

1. Staff abre `/app/social/contas`.
2. Escolhe o cliente e a rede.
3. Ã‰ redirecionado ao agregador para autorizar.
4. Volta ao Orbit com a conta conectada.
5. Conta aparece com status `connected`, nome, avatar e rede.

### 5.2 Criar e agendar post

1. Staff abre o compositor.
2. Escreve o texto, adiciona mÃ­dia e seleciona redes/contas.
3. VÃª preview por rede e valida limites de caracteres/mÃ­dia.
4. Escolhe â€œSalvar rascunhoâ€, â€œEnviar para aprovaÃ§Ã£oâ€ ou â€œAgendarâ€.
5. Se aprovaÃ§Ã£o estiver ativa, o post vai para `pending_approval`.
6. ApÃ³s aprovaÃ§Ã£o, o post vai para `scheduled` e entra na fila.

### 5.3 AprovaÃ§Ã£o no portal

1. Cliente recebe notificaÃ§Ã£o/e-mail.
2. Abre `/portal/social`.
3. VÃª o post, preview, data e redes.
4. Aprova ou rejeita com comentÃ¡rio.
5. Staff Ã© notificado; se aprovado, o post Ã© agendado.

### 5.4 PublicaÃ§Ã£o e falha

1. Worker pega o post due.
2. Marca `publishing` e chama o agregador.
3. Em sucesso, marca `published` e grava IDs externos.
4. Em falha, marca `failed`, grava o erro e agenda retry com backoff.
5. ApÃ³s o limite de tentativas, fica `failed` e notifica o staff.

## 6. Requisitos funcionais

### FR-01 â€” Contas sociais

- Cadastrar conta com `provider`, `provider_account_id`, nome, avatar e cliente.
- Status: `connected`, `expired`, `revoked`, `error`.
- Uma conta pertence a um tenant e pode estar vinculada a um cliente.
- NÃ£o permitir conta duplicada para o mesmo `provider_account_id` no tenant.
- Desconectar remove a conta da seleÃ§Ã£o, mas preserva posts histÃ³ricos.

### FR-02 â€” Compositor

- Texto por post e variaÃ§Ã£o opcional por rede.
- MÃ­dia: imagem e vÃ­deo, com limite por rede.
- SeleÃ§Ã£o de mÃºltiplas contas/redes.
- Preview por rede.
- ValidaÃ§Ã£o antes de salvar/agendar.
- Hashtags e menÃ§Ãµes como texto livre no MVP.
- Agendamento com data/hora; armazenar UTC.

### FR-03 â€” Status do post

Status canÃ´nicos:

| Status                | Significado                                   |
| --------------------- | --------------------------------------------- |
| `draft`               | rascunho editÃ¡vel                            |
| `pending_approval`    | aguardando aprovaÃ§Ã£o do cliente             |
| `approved`            | aprovado, ainda nÃ£o agendado                 |
| `scheduled`           | agendado para publicaÃ§Ã£o                    |
| `publishing`          | sendo publicado                               |
| `published`           | publicado em pelo menos uma rede              |
| `partially_published` | publicado em algumas redes e falhou em outras |
| `failed`              | falhou em todas as tentativas                 |
| `cancelled`           | cancelado pelo staff/cliente                  |
| `rejected`            | rejeitado na aprovaÃ§Ã£o                      |

### FR-04 â€” AprovaÃ§Ã£o

- ConfiguraÃ§Ã£o por tenant: aprovaÃ§Ã£o obrigatÃ³ria `on/off`.
- Staff com permissÃ£o pode aprovar internamente.
- Cliente aprova/rejeita no portal apenas posts do prÃ³prio cliente.
- RejeiÃ§Ã£o exige comentÃ¡rio.
- Toda mudanÃ§a gera evento de auditoria.
- Post aprovado pode ser reagendado; nova alteraÃ§Ã£o de conteÃºdo exige nova aprovaÃ§Ã£o.

### FR-05 â€” Agendamento e fila

- Todo post agendado deve ter `scheduled_at` em UTC.
- Worker busca posts due com lock para evitar publicaÃ§Ã£o dupla.
- IdempotÃªncia por `post_id + target_id + attempt`.
- Retry com backoff: 1 min, 5 min, 15 min, 1 h (mÃ¡ximo configurÃ¡vel).
- Falha definitiva notifica staff.
- MudanÃ§a de horÃ¡rio recalcula o job.

### FR-06 â€” CalendÃ¡rio

- VisÃ£o mensal e lista.
- Agrupar por dia; mostrar status e redes.
- Filtros por cliente, conta, status e rede.
- Clique abre o detalhe do post.
- Arrastar para reagendar (fase 2; no MVP usar ediÃ§Ã£o).

### FR-07 â€” MÃ­dia

- Bucket privado `social_media`.
- Path por tenant: `tenant_id/post_id/uuid.ext`.
- Tipos: JPEG, PNG, WebP, MP4.
- Limite por arquivo e por plano.
- Gerar URL assinada para preview.
- Para o agregador, enviar URL assinada de longa duraÃ§Ã£o ou fazer upload via API.
- Validar MIME real, tamanho e dimensÃµes.

### FR-08 â€” IA (fase 2)

- Gerar legenda a partir de briefing.
- Gerar variaÃ§Ãµes por rede.
- Sugerir hashtags.
- Gerar imagem (opcional, com custo).
- Limite de crÃ©ditos por plano.
- Nunca publicar sem revisÃ£o humana.
- Registrar uso e custo por tenant.

### FR-09 â€” Analytics (fase 2)

- MÃ©tricas por post/rede: impressÃµes, alcance, curtidas, comentÃ¡rios, compartilhamentos, cliques.
- Snapshot diÃ¡rio para evitar chamadas excessivas.
- Dashboard por cliente/perÃ­odo.
- ExportaÃ§Ã£o CSV.

### FR-10 â€” NotificaÃ§Ãµes

- Notificar cliente quando post entra em aprovaÃ§Ã£o.
- Notificar staff quando cliente aprova/rejeita.
- Notificar staff em falha de publicaÃ§Ã£o.
- Notificar cliente quando post Ã© publicado (opcional).
- Canais: in-app e e-mail; webhook opcional.

### FR-11 â€” Auditoria

- Registrar criaÃ§Ã£o, ediÃ§Ã£o, envio para aprovaÃ§Ã£o, aprovaÃ§Ã£o, rejeiÃ§Ã£o, agendamento, cancelamento, publicaÃ§Ã£o e falha.
- Guardar ator, data, IP quando disponÃ­vel e metadados.
- Reutilizar `activity_log` para CRUD e `social_post_events` para o ciclo de publicaÃ§Ã£o.

### FR-12 â€” Limites de plano

| Recurso                 | Limite             |
| ----------------------- | ------------------ |
| Contas sociais          | por plano          |
| Posts publicados/mÃªs   | por plano          |
| Armazenamento de mÃ­dia | por plano          |
| CrÃ©ditos de IA         | por plano (fase 2) |
| Redes disponÃ­veis      | por plano          |

## 7. Modelo de dados

### 7.1 `social_accounts`

| Coluna                                     | Tipo        | Notas                                                 |
| ------------------------------------------ | ----------- | ----------------------------------------------------- |
| `id`                                       | uuid        | PK                                                    |
| `tenant_id`                                | uuid        | FK tenants                                            |
| `company_id`                               | uuid        | FK companies, opcional                                |
| `provider`                                 | text        | `linkedin`, `instagram`, `facebook`, `x`, `tiktok`... |
| `provider_account_id`                      | text        | ID no agregador/rede                                  |
| `display_name`                             | text        | Nome exibido                                          |
| `avatar_url`                               | text        | Opcional                                              |
| `status`                                   | smallint    | 1 connected, 2 expired, 3 revoked, 4 error            |
| `metadata`                                 | jsonb       | Dados do provedor                                     |
| `connected_by`                             | uuid        | profiles                                              |
| `created_at` / `updated_at` / `deleted_at` | timestamptz |                                                       |

Ãndices: `(tenant_id, company_id)`, unique `(tenant_id, provider, provider_account_id)`.

### 7.2 `social_posts`

| Coluna                                     | Tipo             | Notas                       |
| ------------------------------------------ | ---------------- | --------------------------- |
| `id`                                       | uuid             | PK                          |
| `tenant_id`                                | uuid             | FK tenants                  |
| `company_id`                               | uuid             | FK companies                |
| `created_by`                               | uuid             | profiles                    |
| `content`                                  | text             | Texto principal             |
| `status`                                   | text             | status canÃ´nico            |
| `scheduled_at`                             | timestamptz      | UTC                         |
| `published_at`                             | timestamptz      |                             |
| `requires_approval`                        | boolean          | Derivado da configuraÃ§Ã£o  |
| `approved_by` / `approved_at`              | uuid/timestamptz | AprovaÃ§Ã£o interna/cliente |
| `rejected_by` / `rejected_at`              | uuid/timestamptz |                             |
| `rejection_note`                           | text             |                             |
| `failure_reason`                           | text             | Ãšltima falha               |
| `created_at` / `updated_at` / `deleted_at` | timestamptz      |                             |

### 7.3 `social_post_targets`

| Coluna             | Tipo        | Notas                                          |
| ------------------ | ----------- | ---------------------------------------------- |
| `id`               | uuid        | PK                                             |
| `tenant_id`        | uuid        | FK tenants                                     |
| `post_id`          | uuid        | FK social_posts                                |
| `account_id`       | uuid        | FK social_accounts                             |
| `status`           | text        | `pending`, `publishing`, `published`, `failed` |
| `external_post_id` | text        | ID retornado                                   |
| `error`            | text        |                                                |
| `published_at`     | timestamptz |                                                |
| `attempts`         | integer     | default 0                                      |

Unique `(post_id, account_id)`.

### 7.4 `social_media`

| Coluna             | Tipo        | Notas                     |
| ------------------ | ----------- | ------------------------- |
| `id`               | uuid        | PK                        |
| `tenant_id`        | uuid        | FK tenants                |
| `post_id`          | uuid        | FK social_posts, opcional |
| `storage_path`     | text        | path no bucket            |
| `mime_type`        | text        |                           |
| `size_bytes`       | integer     |                           |
| `width` / `height` | integer     |                           |
| `alt_text`         | text        |                           |
| `created_by`       | uuid        | profiles                  |
| `created_at`       | timestamptz |                           |

### 7.5 `social_post_events`

| Coluna       | Tipo        | Notas                                                                                                                    |
| ------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------ |
| `id`         | uuid        | PK                                                                                                                       |
| `tenant_id`  | uuid        | FK tenants                                                                                                               |
| `post_id`    | uuid        | FK social_posts                                                                                                          |
| `event`      | text        | `created`, `submitted`, `approved`, `rejected`, `scheduled`, `publishing`, `published`, `failed`, `retried`, `cancelled` |
| `actor_id`   | uuid        | profiles ou null (worker)                                                                                                |
| `metadata`   | jsonb       |                                                                                                                          |
| `created_at` | timestamptz |                                                                                                                          |

### 7.6 `social_settings`

ConfiguraÃ§Ã£o por tenant:

- `approval_required` boolean;
- `default_timezone` text;
- `ai_enabled` boolean;
- `max_retries` integer;
- `allowed_providers` text[] (opcional).

### 7.7 `social_analytics_snapshots` (fase 2)

- `tenant_id`, `post_id`, `target_id`, `provider`, `date`, `impressions`, `reach`, `likes`, `comments`, `shares`, `clicks`, `raw jsonb`.

## 8. RLS e seguranÃ§a

- Todas as tabelas com `tenant_id` e policy `is_tenant_member`.
- Escrita de contas: apenas `owner`/`admin`.
- Leitura do portal: **RPC `security definer`**, nÃ£o leitura direta.
- Cliente vÃª apenas posts do prÃ³prio `company_id`.
- Cliente sÃ³ pode aprovar/rejeitar posts `pending_approval` do prÃ³prio cliente.
- FunÃ§Ãµes do portal:
  - `portal_list_social_posts(p_company)`;
  - `portal_get_social_post(p_company, p_post)`;
  - `portal_respond_social_post(p_company, p_post, p_approve, p_note)`.
- Tokens/segredos:
  - com agregador, guardar apenas `provider_account_id` e metadados;
  - se houver OAuth nativo, criptografar tokens com Supabase Vault ou chave de aplicaÃ§Ã£o;
  - nunca devolver tokens ao cliente.
- Webhooks do agregador: validar assinatura, idempotÃªncia e origem.
- Rate limit em endpoints pÃºblicos e no envio de aprovaÃ§Ã£o.
- Validar MIME real e tamanho de mÃ­dia.
- NÃ£o permitir URLs arbitrÃ¡rias em mÃ­dia (evitar SSRF).

## 9. Arquitetura

```text
Next.js /app/social
  -> Server Actions (Zod, autorizaÃ§Ã£o, tenant)
  -> Supabase (RLS) para CRUD
  -> Worker/queue para posts agendados
  -> Agregador social (OAuth, publish, metrics)
  -> Supabase Storage (mÃ­dia)
```

### 9.1 Worker

RecomendaÃ§Ã£o:

- **Upstash QStash** (ou Inngest/Trigger.dev) para jobs por horÃ¡rio;
- endpoint interno `POST /api/social/publish` com assinatura;
- fallback por cron a cada 5 min em plano Pro;
- lock por `post_target_id` e status `publishing`;
- retry com backoff e dead-letter.

O cron diÃ¡rio da Vercel **nÃ£o serve** para agendamento com precisÃ£o de minutos.

### 9.2 IntegraÃ§Ã£o com o agregador

- Escolher um agregador que ofereÃ§a:
  - OAuth hospedado;
  - publicaÃ§Ã£o em mÃºltiplas redes;
  - upload de mÃ­dia;
  - status/webhooks;
  - mÃ©tricas bÃ¡sicas.
- Criar uma camada `src/server/social/provider.ts` com interface:
  - `connectUrl()`;
  - `exchangeCode()`;
  - `publish(target)`;
  - `getMetrics(target, range)`.
- Trocar de agregador sem mudar o domÃ­nio do app.

### 9.3 IA

- `OPENAI_API_KEY` e `OPENAI_MODEL` no servidor.
- Endpoint/aÃ§Ã£o `generateSocialCaption`.
- Limite por plano e registro de uso.
- Prompt com briefing, rede, tom e limite de caracteres.
- RevisÃ£o humana obrigatÃ³ria.

## 10. Telas

### Internas

- `/app/social` â€” dashboard: prÃ³ximos posts, aprovaÃ§Ãµes pendentes, falhas, contas conectadas.
- `/app/social/compor` â€” compositor.
- `/app/social/calendario` â€” calendÃ¡rio mensal/lista.
- `/app/social/posts` â€” lista com filtros e status.
- `/app/social/posts/[id]` â€” detalhe, targets, timeline, retry.
- `/app/social/contas` â€” conectar/desconectar contas.
- `/app/social/configuracoes` â€” aprovaÃ§Ã£o, IA, fuso, retries.
- `/app/social/analytics` â€” fase 2.

### Portal

- `/portal/social` â€” posts do cliente, pendentes de aprovaÃ§Ã£o.
- `/portal/social/[id]` â€” preview, aprovar/rejeitar com comentÃ¡rio.

### Componentes

- `social-post-card`, `social-status-badge`, `social-network-icon`, `social-preview`, `social-calendar`, `social-approval-dialog`, `social-media-picker`, `social-composer`.

## 11. Server actions e queries

### Actions

- `connectSocialAccountAction`
- `disconnectSocialAccountAction`
- `createSocialPostAction`
- `updateSocialPostAction`
- `submitSocialPostAction`
- `approveSocialPostAction`
- `rejectSocialPostAction`
- `scheduleSocialPostAction`
- `cancelSocialPostAction`
- `retrySocialPostAction`
- `generateSocialCaptionAction` (fase 2)

### Queries

- `listSocialPosts(tenantId, filters)`
- `getSocialPost(tenantId, id)`
- `listSocialAccounts(tenantId, companyId?)`
- `listSocialCalendar(tenantId, range)`
- `listPendingApprovals(tenantId)`
- `listSocialMetrics(tenantId, range)` (fase 2)

### Rotas

- `POST /api/social/publish` â€” worker.
- `GET /api/social/callback` â€” retorno do agregador.
- `POST /api/social/webhook` â€” status do agregador.
- `GET /app/exportar/social` â€” CSV.

## 12. NotificaÃ§Ãµes e auditoria

- NotificaÃ§Ã£o in-app ao cliente quando `pending_approval`.
- E-mail ao cliente com link do portal.
- NotificaÃ§Ã£o ao staff em aprovaÃ§Ã£o/rejeiÃ§Ã£o/falha.
- `social_post_events` para timeline.
- `activity_log` para CRUD de posts/contas.
- Registrar `actor_id`, `tenant_id`, `post_id`, `event`, `metadata`.

## 13. Requisitos nÃ£o funcionais

- PublicaÃ§Ã£o dentro de Â±2 minutos do horÃ¡rio agendado.
- IdempotÃªncia: nunca publicar duas vezes o mesmo target.
- Retry mÃ¡ximo configurÃ¡vel (default 4).
- p95 do compositor < 2 s (sem upload).
- Upload de mÃ­dia atÃ© o limite do plano.
- RLS testada para isolamento entre tenants.
- Logs estruturados para publicaÃ§Ã£o/falha.
- Erros do agregador nÃ£o devem vazar tokens/segredos.
- Funcionar em mobile (compositor e aprovaÃ§Ã£o).
- Acessibilidade: labels, foco, contraste e preview textual.

## 14. Fases de entrega

### Fase 1 â€” MVP (4 a 6 semanas)

- Contas via agregador.
- Compositor, mÃ­dia, mÃºltiplas contas.
- Rascunho, aprovaÃ§Ã£o, agendamento, publicaÃ§Ã£o, retry.
- CalendÃ¡rio e lista.
- Portal de aprovaÃ§Ã£o.
- NotificaÃ§Ãµes e auditoria.
- Limites de plano e CSV.

### Fase 2 â€” Produtividade (3 a 5 semanas)

- IA para legendas, variaÃ§Ãµes e hashtags.
- Templates, RSS, posts recorrentes.
- Analytics bÃ¡sico e snapshots.
- Melhor horÃ¡rio.
- RelatÃ³rio PDF/white-label.

### Fase 3 â€” Escala

- OAuth nativo para redes prioritÃ¡rias.
- Inbox/comentÃ¡rios.
- Social listening.
- AnÃºncios.
- AprovaÃ§Ã£o multi-etapas e agÃªncia/subclientes.

## 15. CritÃ©rios de aceite do MVP

- [ ] Conectar conta LinkedIn/Instagram/Facebook/X via agregador.
- [ ] Criar post com texto, imagem e 2+ contas.
- [ ] Salvar rascunho e retomÃ¡-lo.
- [ ] Enviar para aprovaÃ§Ã£o e ver no portal do cliente.
- [ ] Cliente aprova/rejeita com comentÃ¡rio.
- [ ] Staff agenda e worker publica no horÃ¡rio.
- [ ] Falha gera status, erro visÃ­vel e retry.
- [ ] Reagendar/cancelar funciona.
- [ ] CalendÃ¡rio mostra posts por dia/status.
- [ ] NotificaÃ§Ãµes e auditoria registram os eventos.
- [ ] Limites de plano bloqueiam excesso de contas/posts.
- [ ] RLS impede acesso entre tenants.
- [ ] Portal sÃ³ mostra posts do prÃ³prio cliente.
- [ ] Testes unitÃ¡rios, RLS e E2E dos fluxos principais.
- [ ] `format:check`, `lint`, `typecheck`, `test`, `build` verdes.

## 16. Riscos

| Risco                          | Impacto               | MitigaÃ§Ã£o                                         |
| ------------------------------ | --------------------- | --------------------------------------------------- |
| AprovaÃ§Ã£o de apps das redes  | atraso                | usar agregador no MVP                               |
| Tokens/segredos                | seguranÃ§a            | nÃ£o armazenar tokens nativos; Vault se necessÃ¡rio |
| Rate limits das APIs           | falhas                | fila, backoff e cache de mÃ©tricas                  |
| MÃ­dia rejeitada por rede      | falha de publicaÃ§Ã£o | validaÃ§Ã£o por rede antes de agendar               |
| Fuso horÃ¡rio                  | post na hora errada   | UTC no banco, conversÃ£o explÃ­cita na UI           |
| Worker fora do ar              | atraso                | QStash/cron + alerta + reprocessamento              |
| Custo de IA                    | margem                | crÃ©ditos por plano e limite rÃ­gido                |
| Escopo excessivo               | atraso                | fases e nÃ£o-goals explÃ­citos                      |
| Licenciamento das referÃªncias | jurÃ­dico             | clean-room; nÃ£o copiar cÃ³digo/assets              |

## 17. DecisÃµes abertas

1. Qual agregador usar (Ayrshare, Post Bridge, outro)?
2. Quais redes entram no MVP alÃ©m de LinkedIn/Instagram/Facebook/X?
3. AprovaÃ§Ã£o Ã© obrigatÃ³ria para todos os clientes ou configurÃ¡vel por cliente?
4. Limite de mÃ­dia por plano (quantidade e MB).
5. PreÃ§o do add-on Social e limites comerciais.
6. Analytics via agregador ou APIs nativas na fase 2?
7. IA: OpenAI apenas ou provider abstraÃ­do?
8. Precisamos de timezone por tenant ou por usuÃ¡rio?

## 18. ReferÃªncias e licenciamento

As referÃªncias analisadas sÃ£o proprietÃ¡rias (CodeCanyon/Envato/AltumCode) e **nÃ£o podem ser copiadas**. Este documento usa apenas conceitos de produto e estrutura.

- **Stackposts**: melhor mapa de features (publishing, approvals, AI, channels, teams, calendar, RSS, watermark).
- **SocialVibe**: melhor referÃªncia de UX/arquitetura (Vue 3, client, accounts, posts, calendar, AI writer).
- **Mingle SAAS**: melhor cobertura de redes e analytics/calendar.
- **BeePost**: referÃªncia de scheduling + real-time (socket.io).
- **QuickPost**: referÃªncia de MVP enxuto (scheduler + AI post/image).

## 19. Anexos

### 19.1 Status de target

`pending` â†’ `publishing` â†’ `published` | `failed`

### 19.2 Eventos de post

`created`, `updated`, `submitted`, `approved`, `rejected`, `scheduled`, `publishing`, `published`, `partially_published`, `failed`, `retried`, `cancelled`.

### 19.3 Checklist de UI do compositor

- [ ] seleÃ§Ã£o de cliente
- [ ] seleÃ§Ã£o de contas
- [ ] texto e contador por rede
- [ ] upload e preview de mÃ­dia
- [ ] preview por rede
- [ ] validaÃ§Ã£o de limites
- [ ] agendamento
- [ ] salvar rascunho
- [ ] enviar para aprovaÃ§Ã£o
- [ ] agendar/publicar
- [ ] feedback de erro/sucesso

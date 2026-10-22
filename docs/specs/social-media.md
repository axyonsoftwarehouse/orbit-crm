# Spec — Módulo de Social Media do Orbit CRM

> Status: rascunho para implementação
> Versão: 0.1
> Data: outubro/2026
> Produto: Orbit CRM
> Referências analisadas: Stackposts v10.0, SocialVibe v2.1.0, Mingle SAAS v5.5.8, BeePost v2.2 e QuickPost v1.0

## 1. Objetivo

Adicionar ao Orbit um módulo de **gestão de redes sociais** para agências e prestadores de serviço, integrado ao cliente, ao projeto e ao portal do cliente.

O módulo deve permitir:

- conectar contas sociais por cliente;
- criar posts com texto, mídia e múltiplas redes;
- agendar, publicar e reagendar;
- enviar posts para aprovação do cliente no portal;
- acompanhar status, falhas e histórico;
- gerar conteúdo com IA;
- consultar métricas básicas por post/rede.

A implementação será **nativa em Next.js + Supabase**. Os projetos de referência servem apenas como mapa de features e UX; nenhum código, SQL, asset ou layout será copiado.

## 2. Decisões de produto

| Tema            | Decisão                                                                  |
| --------------- | ------------------------------------------------------------------------ |
| Posicionamento  | Módulo **Social** dentro do Orbit, opcional por plano                    |
| Integrações     | Agregador de redes sociais no MVP; OAuth nativo só depois                |
| Publicação      | Staff cria/agenda; cliente aprova no portal                              |
| Aprovação       | Obrigatória por padrão para posts de cliente; owner/admin pode desativar |
| Redes iniciais  | LinkedIn (perfil/página), Instagram (business), Facebook Pages e X       |
| Redes seguintes | TikTok, Threads, YouTube, Pinterest, Google Business                     |
| Fuso horário    | Armazenar UTC; UI converte para o fuso do navegador no MVP               |
| Mídia           | Supabase Storage privado + URLs assinadas/upload para o agregador        |
| Analytics       | Fase 2; snapshots diários, sem prometer tempo real                       |
| IA              | Fase 2; OpenAI via chave do servidor, com limite por plano               |
| Multi-tenant    | `tenant_id` em todas as tabelas + RLS                                    |

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

### 2.2 Modo manual (MVP de custo zero)

Antes de contratar um agregador, o Orbit opera em **modo manual** (`publish_mode = manual`):

- staff cria, agenda e o cliente aprova no portal;
- no horário, o sistema notifica o autor (in-app + e-mail);
- o autor copia o conteúdo ou usa links/intents de compartilhamento;
- publica manualmente na rede e marca o post como publicado;
- `social_post_events` registra a publicação manual.

O modo `provider` fica preparado para a integração futura com Ayrshare/Upload-Post.

## 3. Escopo do MVP

### 3.1 Incluído

- Contas sociais por cliente/tenant.
- Compositor de post com preview por rede.
- Múltiplas redes e múltiplas contas por post.
- Rascunho, envio para aprovação, aprovação, agendamento, publicação e falha.
- Calendário mensal e lista de posts.
- Fila de publicação com retry e idempotência.
- Portal do cliente para aprovar/rejeitar posts.
- Notificações internas e por e-mail.
- Auditoria de criação/aprovação/publicação.
- Limites de plano: contas, posts/mês e armazenamento.
- Exportação CSV do histórico.

### 3.2 Fora do MVP

- Caixa de entrada/DMs/comentários.
- Social listening.
- Gestão de anúncios.
- OAuth nativo de todas as redes.
- Analytics avançado e relatórios white-label.
- Aprovação em múltiplas etapas.
- Fluxo de agência com subclientes.
- Publicação de stories/reels com recursos específicos de cada rede.
- Agendamento recorrente e RSS (fase 2).

## 4. Personas e papéis

| Papel             | Pode                                                                  |
| ----------------- | --------------------------------------------------------------------- |
| `owner`           | tudo no tenant, incluindo conectar contas e configurar aprovação      |
| `admin`           | tudo do owner, exceto transferir propriedade                          |
| `member`          | criar/editar rascunhos, enviar para aprovação, ver posts e calendário |
| Cliente do portal | ver posts do próprio cliente, aprovar/rejeitar, acompanhar status     |

### 4.1 Matriz de permissões

| Ação                              | Owner | Admin | Member | Cliente                  |
| --------------------------------- | ----- | ----- | ------ | ------------------------ |
| Conectar/desconectar conta social | Sim   | Sim   | Não    | Não                      |
| Criar/editar rascunho             | Sim   | Sim   | Sim    | Não                      |
| Excluir rascunho de outro autor   | Sim   | Sim   | Não    | Não                      |
| Enviar para aprovação             | Sim   | Sim   | Sim    | Não                      |
| Aprovar/rejeitar internamente     | Sim   | Sim   | Não    | Não                      |
| Aprovar/rejeitar no portal        | —     | —     | —      | Sim                      |
| Agendar/publicar                  | Sim   | Sim   | Não    | Não                      |
| Reagendar/cancelar                | Sim   | Sim   | Não    | Não                      |
| Ver métricas                      | Sim   | Sim   | Sim    | Sim (do próprio cliente) |
| Configurar IA e aprovação         | Sim   | Sim   | Não    | Não                      |

## 5. Jornadas principais

### 5.1 Conectar conta

1. Staff abre `/app/social/contas`.
2. Escolhe o cliente e a rede.
3. É redirecionado ao agregador para autorizar.
4. Volta ao Orbit com a conta conectada.
5. Conta aparece com status `connected`, nome, avatar e rede.

### 5.2 Criar e agendar post

1. Staff abre o compositor.
2. Escreve o texto, adiciona mídia e seleciona redes/contas.
3. Vê preview por rede e valida limites de caracteres/mídia.
4. Escolhe “Salvar rascunho”, “Enviar para aprovação” ou “Agendar”.
5. Se aprovação estiver ativa, o post vai para `pending_approval`.
6. Após aprovação, o post vai para `scheduled` e entra na fila.

### 5.3 Aprovação no portal

1. Cliente recebe notificação/e-mail.
2. Abre `/portal/social`.
3. Vê o post, preview, data e redes.
4. Aprova ou rejeita com comentário.
5. Staff é notificado; se aprovado, o post é agendado.

### 5.4 Publicação e falha

1. Worker pega o post due.
2. Marca `publishing` e chama o agregador.
3. Em sucesso, marca `published` e grava IDs externos.
4. Em falha, marca `failed`, grava o erro e agenda retry com backoff.
5. Após o limite de tentativas, fica `failed` e notifica o staff.

## 6. Requisitos funcionais

### FR-01 — Contas sociais

- Cadastrar conta com `provider`, `provider_account_id`, nome, avatar e cliente.
- Status: `connected`, `expired`, `revoked`, `error`.
- Uma conta pertence a um tenant e pode estar vinculada a um cliente.
- Não permitir conta duplicada para o mesmo `provider_account_id` no tenant.
- Desconectar remove a conta da seleção, mas preserva posts históricos.

### FR-02 — Compositor

- Texto por post e variação opcional por rede.
- Mídia: imagem e vídeo, com limite por rede.
- Seleção de múltiplas contas/redes.
- Preview por rede.
- Validação antes de salvar/agendar.
- Hashtags e menções como texto livre no MVP.
- Agendamento com data/hora; armazenar UTC.

### FR-03 — Status do post

Status canônicos:

| Status                | Significado                                   |
| --------------------- | --------------------------------------------- |
| `draft`               | rascunho editável                             |
| `pending_approval`    | aguardando aprovação do cliente               |
| `approved`            | aprovado, ainda não agendado                  |
| `scheduled`           | agendado para publicação                      |
| `publishing`          | sendo publicado                               |
| `published`           | publicado em pelo menos uma rede              |
| `partially_published` | publicado em algumas redes e falhou em outras |
| `failed`              | falhou em todas as tentativas                 |
| `cancelled`           | cancelado pelo staff/cliente                  |
| `rejected`            | rejeitado na aprovação                        |

### FR-04 — Aprovação

- Configuração por tenant: aprovação obrigatória `on/off`.
- Staff com permissão pode aprovar internamente.
- Cliente aprova/rejeita no portal apenas posts do próprio cliente.
- Rejeição exige comentário.
- Toda mudança gera evento de auditoria.
- Post aprovado pode ser reagendado; nova alteração de conteúdo exige nova aprovação.

### FR-05 — Agendamento e fila

- Todo post agendado deve ter `scheduled_at` em UTC.
- Worker busca posts due com lock para evitar publicação dupla.
- Idempotência por `post_id + target_id + attempt`.
- Retry com backoff: 1 min, 5 min, 15 min, 1 h (máximo configurável).
- Falha definitiva notifica staff.
- Mudança de horário recalcula o job.

### FR-06 — Calendário

- Visão mensal e lista.
- Agrupar por dia; mostrar status e redes.
- Filtros por cliente, conta, status e rede.
- Clique abre o detalhe do post.
- Arrastar para reagendar (fase 2; no MVP usar edição).

### FR-07 — Mídia

- Bucket privado `social_media`.
- Path por tenant: `tenant_id/post_id/uuid.ext`.
- Tipos: JPEG, PNG, WebP, MP4.
- Limite por arquivo e por plano.
- Gerar URL assinada para preview.
- Para o agregador, enviar URL assinada de longa duração ou fazer upload via API.
- Validar MIME real, tamanho e dimensões.

### FR-08 — IA (fase 2)

- Gerar legenda a partir de briefing.
- Gerar variações por rede.
- Sugerir hashtags.
- Gerar imagem (opcional, com custo).
- Limite de créditos por plano.
- Nunca publicar sem revisão humana.
- Registrar uso e custo por tenant.

### FR-09 — Analytics (fase 2)

- Métricas por post/rede: impressões, alcance, curtidas, comentários, compartilhamentos, cliques.
- Snapshot diário para evitar chamadas excessivas.
- Dashboard por cliente/período.
- Exportação CSV.

### FR-10 — Notificações

- Notificar cliente quando post entra em aprovação.
- Notificar staff quando cliente aprova/rejeita.
- Notificar staff em falha de publicação.
- Notificar cliente quando post é publicado (opcional).
- Canais: in-app e e-mail; webhook opcional.

### FR-11 — Auditoria

- Registrar criação, edição, envio para aprovação, aprovação, rejeição, agendamento, cancelamento, publicação e falha.
- Guardar ator, data, IP quando disponível e metadados.
- Reutilizar `activity_log` para CRUD e `social_post_events` para o ciclo de publicação.

### FR-12 — Limites de plano

| Recurso                | Limite             |
| ---------------------- | ------------------ |
| Contas sociais         | por plano          |
| Posts publicados/mês   | por plano          |
| Armazenamento de mídia | por plano          |
| Créditos de IA         | por plano (fase 2) |
| Redes disponíveis      | por plano          |

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

Índices: `(tenant_id, company_id)`, unique `(tenant_id, provider, provider_account_id)`.

### 7.2 `social_posts`

| Coluna                                     | Tipo             | Notas                     |
| ------------------------------------------ | ---------------- | ------------------------- |
| `id`                                       | uuid             | PK                        |
| `tenant_id`                                | uuid             | FK tenants                |
| `company_id`                               | uuid             | FK companies              |
| `created_by`                               | uuid             | profiles                  |
| `content`                                  | text             | Texto principal           |
| `status`                                   | text             | status canônico           |
| `scheduled_at`                             | timestamptz      | UTC                       |
| `published_at`                             | timestamptz      |                           |
| `requires_approval`                        | boolean          | Derivado da configuração  |
| `approved_by` / `approved_at`              | uuid/timestamptz | Aprovação interna/cliente |
| `rejected_by` / `rejected_at`              | uuid/timestamptz |                           |
| `rejection_note`                           | text             |                           |
| `failure_reason`                           | text             | Última falha              |
| `created_at` / `updated_at` / `deleted_at` | timestamptz      |                           |

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

Configuração por tenant:

- `approval_required` boolean;
- `default_timezone` text;
- `ai_enabled` boolean;
- `max_retries` integer;
- `allowed_providers` text[] (opcional).

### 7.7 `social_analytics_snapshots` (fase 2)

- `tenant_id`, `post_id`, `target_id`, `provider`, `date`, `impressions`, `reach`, `likes`, `comments`, `shares`, `clicks`, `raw jsonb`.

## 8. RLS e segurança

- Todas as tabelas com `tenant_id` e policy `is_tenant_member`.
- Escrita de contas: apenas `owner`/`admin`.
- Leitura do portal: **RPC `security definer`**, não leitura direta.
- Cliente vê apenas posts do próprio `company_id`.
- Cliente só pode aprovar/rejeitar posts `pending_approval` do próprio cliente.
- Funções do portal:
  - `portal_list_social_posts(p_company)`;
  - `portal_get_social_post(p_company, p_post)`;
  - `portal_respond_social_post(p_company, p_post, p_approve, p_note)`.
- Tokens/segredos:
  - com agregador, guardar apenas `provider_account_id` e metadados;
  - se houver OAuth nativo, criptografar tokens com Supabase Vault ou chave de aplicação;
  - nunca devolver tokens ao cliente.
- Webhooks do agregador: validar assinatura, idempotência e origem.
- Rate limit em endpoints públicos e no envio de aprovação.
- Validar MIME real e tamanho de mídia.
- Não permitir URLs arbitrárias em mídia (evitar SSRF).

## 9. Arquitetura

```text
Next.js /app/social
  -> Server Actions (Zod, autorização, tenant)
  -> Supabase (RLS) para CRUD
  -> Worker/queue para posts agendados
  -> Agregador social (OAuth, publish, metrics)
  -> Supabase Storage (mídia)
```

### 9.1 Worker

Recomendação:

- **Upstash QStash** (ou Inngest/Trigger.dev) para jobs por horário;
- endpoint interno `POST /api/social/publish` com assinatura;
- fallback por cron a cada 5 min em plano Pro;
- lock por `post_target_id` e status `publishing`;
- retry com backoff e dead-letter.

O cron diário da Vercel **não serve** para agendamento com precisão de minutos.

### 9.2 Integração com o agregador

- Escolher um agregador que ofereça:
  - OAuth hospedado;
  - publicação em múltiplas redes;
  - upload de mídia;
  - status/webhooks;
  - métricas básicas.
- Criar uma camada `src/server/social/provider.ts` com interface:
  - `connectUrl()`;
  - `exchangeCode()`;
  - `publish(target)`;
  - `getMetrics(target, range)`.
- Trocar de agregador sem mudar o domínio do app.

### 9.3 IA

- `OPENAI_API_KEY` e `OPENAI_MODEL` no servidor.
- Endpoint/ação `generateSocialCaption`.
- Limite por plano e registro de uso.
- Prompt com briefing, rede, tom e limite de caracteres.
- Revisão humana obrigatória.

## 10. Telas

### Internas

- `/app/social` — dashboard: próximos posts, aprovações pendentes, falhas, contas conectadas.
- `/app/social/compor` — compositor.
- `/app/social/calendario` — calendário mensal/lista.
- `/app/social/posts` — lista com filtros e status.
- `/app/social/posts/[id]` — detalhe, targets, timeline, retry.
- `/app/social/contas` — conectar/desconectar contas.
- `/app/social/configuracoes` — aprovação, IA, fuso, retries.
- `/app/social/analytics` — fase 2.

### Portal

- `/portal/social` — posts do cliente, pendentes de aprovação.
- `/portal/social/[id]` — preview, aprovar/rejeitar com comentário.

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

- `POST /api/social/publish` — worker.
- `GET /api/social/callback` — retorno do agregador.
- `POST /api/social/webhook` — status do agregador.
- `GET /app/exportar/social` — CSV.

## 12. Notificações e auditoria

- Notificação in-app ao cliente quando `pending_approval`.
- E-mail ao cliente com link do portal.
- Notificação ao staff em aprovação/rejeição/falha.
- `social_post_events` para timeline.
- `activity_log` para CRUD de posts/contas.
- Registrar `actor_id`, `tenant_id`, `post_id`, `event`, `metadata`.

## 13. Requisitos não funcionais

- Publicação dentro de ±2 minutos do horário agendado.
- Idempotência: nunca publicar duas vezes o mesmo target.
- Retry máximo configurável (default 4).
- p95 do compositor < 2 s (sem upload).
- Upload de mídia até o limite do plano.
- RLS testada para isolamento entre tenants.
- Logs estruturados para publicação/falha.
- Erros do agregador não devem vazar tokens/segredos.
- Funcionar em mobile (compositor e aprovação).
- Acessibilidade: labels, foco, contraste e preview textual.

## 14. Fases de entrega

### Fase 1A — Manual (custo zero, implementado)

- Contas cadastradas manualmente.
- Compositor de texto e múltiplas contas.
- Rascunho, aprovação, agendamento, lembretes e marcação como publicado.
- Copiar conteúdo, compartilhar via Web Share/links e histórico.
- Portal de aprovação.
- Limites de plano, auditoria e CSV.

### Fase 1B — Publicação automática (agregador)

- OAuth/conexão real via agregador.
- Upload de mídia.
- Worker de publicação, retry e webhooks.
- Calendário e analytics inicial.

### Fase 2 — Produtividade (3 a 5 semanas)

- IA para legendas, variações e hashtags.
- Templates, RSS, posts recorrentes.
- Analytics básico e snapshots.
- Melhor horário.
- Relatório PDF/white-label.

### Fase 3 — Escala

- OAuth nativo para redes prioritárias.
- Inbox/comentários.
- Social listening.
- Anúncios.
- Aprovação multi-etapas e agência/subclientes.

## 15. Critérios de aceite do MVP

- [ ] Conectar conta LinkedIn/Instagram/Facebook/X via agregador.
- [ ] Criar post com texto, imagem e 2+ contas.
- [ ] Salvar rascunho e retomá-lo.
- [ ] Enviar para aprovação e ver no portal do cliente.
- [ ] Cliente aprova/rejeita com comentário.
- [ ] Staff agenda e worker publica no horário.
- [ ] Falha gera status, erro visível e retry.
- [ ] Reagendar/cancelar funciona.
- [ ] Calendário mostra posts por dia/status.
- [ ] Notificações e auditoria registram os eventos.
- [ ] Limites de plano bloqueiam excesso de contas/posts.
- [ ] RLS impede acesso entre tenants.
- [ ] Portal só mostra posts do próprio cliente.
- [ ] Testes unitários, RLS e E2E dos fluxos principais.
- [ ] `format:check`, `lint`, `typecheck`, `test`, `build` verdes.

## 16. Riscos

| Risco                         | Impacto             | Mitigação                                         |
| ----------------------------- | ------------------- | ------------------------------------------------- |
| Aprovação de apps das redes   | atraso              | usar agregador no MVP                             |
| Tokens/segredos               | segurança           | não armazenar tokens nativos; Vault se necessário |
| Rate limits das APIs          | falhas              | fila, backoff e cache de métricas                 |
| Mídia rejeitada por rede      | falha de publicação | validação por rede antes de agendar               |
| Fuso horário                  | post na hora errada | UTC no banco, conversão explícita na UI           |
| Worker fora do ar             | atraso              | QStash/cron + alerta + reprocessamento            |
| Custo de IA                   | margem              | créditos por plano e limite rígido                |
| Escopo excessivo              | atraso              | fases e não-goals explícitos                      |
| Licenciamento das referências | jurídico            | clean-room; não copiar código/assets              |

## 17. Decisões abertas

1. Qual agregador usar (Ayrshare, Post Bridge, outro)?
2. Quais redes entram no MVP além de LinkedIn/Instagram/Facebook/X?
3. Aprovação é obrigatória para todos os clientes ou configurável por cliente?
4. Limite de mídia por plano (quantidade e MB).
5. Preço do add-on Social e limites comerciais.
6. Analytics via agregador ou APIs nativas na fase 2?
7. IA: OpenAI apenas ou provider abstraído?
8. Precisamos de timezone por tenant ou por usuário?

## 18. Referências e licenciamento

As referências analisadas são proprietárias (CodeCanyon/Envato/AltumCode) e **não podem ser copiadas**. Este documento usa apenas conceitos de produto e estrutura.

- **Stackposts**: melhor mapa de features (publishing, approvals, AI, channels, teams, calendar, RSS, watermark).
- **SocialVibe**: melhor referência de UX/arquitetura (Vue 3, client, accounts, posts, calendar, AI writer).
- **Mingle SAAS**: melhor cobertura de redes e analytics/calendar.
- **BeePost**: referência de scheduling + real-time (socket.io).
- **QuickPost**: referência de MVP enxuto (scheduler + AI post/image).

## 19. Anexos

### 19.1 Status de target

`pending` → `publishing` → `published` | `failed`

### 19.2 Eventos de post

`created`, `updated`, `submitted`, `approved`, `rejected`, `scheduled`, `publishing`, `published`, `partially_published`, `failed`, `retried`, `cancelled`.

### 19.3 Checklist de UI do compositor

- [ ] seleção de cliente
- [ ] seleção de contas
- [ ] texto e contador por rede
- [ ] upload e preview de mídia
- [ ] preview por rede
- [ ] validação de limites
- [ ] agendamento
- [ ] salvar rascunho
- [ ] enviar para aprovação
- [ ] agendar/publicar
- [ ] feedback de erro/sucesso

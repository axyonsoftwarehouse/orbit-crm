# Limites de plano extras Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Limites de plano configuráveis para tags, campos personalizados, marcos e storage, sem valores iniciais.

**Architecture:** Estende `RESOURCES` em `src/server/plan-limits.ts` (novo escopo `all`) e acrescenta `checkStorageLimitWith`, que soma o uso pelo RPC `tenant_storage_bytes` (migration `0057`). As actions de criação e de registro de upload chamam as checagens.

**Tech Stack:** Next.js 15 server actions, Supabase (Postgres/Storage), Vitest.

**Spec:** `docs/superpowers/specs/2026-11-19-limites-plano-extras-design.md`

## Global Constraints

- Chave ausente ou `null` = ilimitado. Nenhuma migration grava valores em `plans`.
- 1 MB = 1048576 bytes. Mensagem de bloqueio de storage: "Limite de armazenamento do plano atingido. Faça upgrade para continuar."
- `dbError` para erros de banco; commits `tipo: descrição` em português; `git add` explícito.

## Review Focus

- `storage_mb = 0` → bloqueia qualquer upload (teste na Task 2).
- `storage.info` falhando no registro → erro, sem inserir linha (teste na Task 3).
- `tenant_storage_bytes` retornando `null` (tenant sem arquivos) → tratado como 0 (teste na Task 2).
- Tag criada pela tela da entidade (`createTagForEntityAction`) também barrada (teste na Task 3).
- Arquivo removido do bucket quando o registro estoura o limite (teste na Task 3).

---

### Task 1: Chaves novas e escopo `all`

**Files:** Modify `src/lib/constants.ts` (`PLAN_LIMIT_FIELDS` + `{ key: "tags", label: "Tags" }`, `{ key: "custom_fields", label: "Campos personalizados" }`, `{ key: "milestones", label: "Marcos" }`, `{ key: "storage_mb", label: "Armazenamento (MB)" }`), `src/server/plan-limits.ts`. Test: `tests/unit/plan-limits.test.ts`.

**Produces:** `RESOURCES.tags = { table: "tags", scope: "all" }`, `custom_fields = { table: "custom_field_definitions", scope: "all" }`, `milestones = { table: "milestones", scope: "active" }`.

- [ ] Testes: `tags` no limite → `ok:false`, tabela `tags`, **sem** chamada `is`; `custom_fields` idem em `custom_field_definitions`; `milestones` com `is("deleted_at", null)`; `planSchema` aceita as 4 chaves novas.
- [ ] Rodar → FAIL. Implementar. Rodar → PASS. Commit `feat: limites de plano para tags, campos personalizados e marcos`.

### Task 2: Cota de storage

**Files:** Create `supabase/migrations/0057_tenant_storage_bytes.sql`; modify `src/server/plan-limits.ts`, `src/lib/database.types.ts` (Functions: `tenant_storage_bytes: { Args: { p_tenant: string }; Returns: number }`); create `src/server/actions/storage.ts`. Tests: `tests/unit/plan-limits.test.ts`, `tests/unit/actions-storage.test.ts`, `tests/rls/isolation.test.ts`.

**Produces:**
- `checkStorageLimitWith(supabase, tenantId, incomingBytes: number): Promise<PlanLimitResult>` e `checkStorageLimit(tenantId, incomingBytes)`.
- `checkStorageQuotaAction(sizeBytes: number): Promise<{ error?: string }>`.
- SQL `tenant_storage_bytes(p_tenant uuid) returns bigint`, `security invoker`, soma `size_bytes` de `attachments` + `social_media` do tenant (coalesce 0); execute só para `authenticated`/`service_role`.

- [ ] Testes: sem `storage_mb` → ok, sem chamar RPC; usado 900 MB + arquivo 200 MB com limite 1000 → bloqueia com a mensagem; 900 MB + 50 MB → ok; RPC `null` → 0; limite 0 → bloqueia arquivo de 1 byte; action sem tenant → erro. RLS: owner A vê soma de A; owner B consultando A recebe 0.
- [ ] Rodar → FAIL. Implementar. Rodar → PASS. Commit `feat: cota de armazenamento por plano`.

### Task 3: Ligar às actions e uploaders

**Files:** Modify `src/server/actions/tags.ts`, `custom-fields.ts`, `milestones.ts`, `attachments.ts`, `social.ts` (`registerSocialMediaAction`), `src/components/app/attachment-uploader.tsx`, `src/app/app/social/[id]/social-media-uploader.tsx`, `docs/mapa/06-problemas-e-dividas.md`. Tests: `tests/unit/actions-plan-limits.test.ts`.

- [ ] Testes (mock de `@/server/plan-limits`): `createTagAction`, `createTagForEntityAction`, `createCustomFieldAction`, `createMilestoneAction` devolvem a mensagem do limite e não inserem; `registerAttachmentAction` usa `size` de `storage.info`, grava esse tamanho, e com limite estourado chama `remove([path])` e não insere; `info` com erro → `{ error }` sem inserir; o mesmo para `registerSocialMediaAction`.
- [ ] Rodar → FAIL. Implementar (uploaders: `await checkStorageQuotaAction(file.size)` antes do `upload`, com `toast.error` e retorno). Rodar → PASS.
- [ ] Os 5 comandos do AGENTS.md passam. Commits `feat: aplica limites de plano nas actions e uploads` e `docs: atualiza item #6 do mapa`.

# Social — aprovação obrigatória e notificações Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fazer valer `social_settings.approval_required` (com tela para owner/admin) e avisar cliente e equipe nas etapas de aprovação do Social.

**Architecture:** Regra pura em `src/lib/social-approval.ts`; avisos best-effort com o cliente admin em `src/server/social/approval-notifications.ts`, chamados pelas server actions existentes em `src/server/actions/social.ts`; tela nova `/app/social/configuracoes`.

**Tech Stack:** Next.js 15 (App Router, server actions), Supabase, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-19-social-aprovacao-notificacoes-design.md`

## Global Constraints

- Sem migration: `social_settings` e suas policies já existem (`0049`).
- Avisos nunca bloqueiam nem desfazem a transição do post (`try/catch` + `logger.error`).
- Erros de banco nas actions: `dbError(contexto, error)`.
- Commits `tipo: descrição` em português; `git add` com arquivos explícitos.
- Antes do PR: `npm run format:check`, `lint`, `typecheck`, `test`, `build`.

## Review Focus

- Contato do portal sem `email` ou excluído → ignorado (teste na Task 3).
- Post sem `created_by` → avisa owner/admin ativos do tenant do post (teste na Task 3).
- `profiles.notify_email = false` → só notificação no app, sem e-mail (teste na Task 3).
- RPC do portal devolve `false` (post já respondido) → nenhum aviso (teste na Task 4).
- `member` chamando `updateSocialSettingsAction` → recusado sem gravar (teste na Task 2).

---

### Task 1: Aprovação obrigatória na criação do post

**Files:**

- Create: `src/lib/social-approval.ts`
- Modify: `src/server/actions/social.ts` (`createSocialPostAction`)
- Modify: `src/app/app/social/social-post-form-dialog.tsx` (prop `approvalRequired` no lugar de `defaultApproval`), `src/app/app/social/page.tsx`, `src/app/app/social/calendario/page.tsx`
- Test: `tests/unit/social-approval.test.ts`

**Interfaces:**

- Produces: `resolveRequiresApproval(settingRequired: boolean, requested: boolean): boolean`

- [ ] **Step 1: Testes** `resolveRequiresApproval(true, false) === true`, `(true, true) === true`, `(false, false) === false`, `(false, true) === true`.
- [ ] **Step 2:** `npx vitest run tests/unit/social-approval.test.ts` → FAIL (módulo inexistente).
- [ ] **Step 3:** Implementar. Em `createSocialPostAction`, ler `getSocialSettings(active.tenantId)` e gravar `requires_approval = resolveRequiresApproval(settings.approval_required, parsed.requires_approval)` (status deriva desse valor). No formulário: se `approvalRequired`, mandar `<input type="hidden" name="requires_approval" value="on">` e mostrar o texto "Aprovação do cliente obrigatória. Owner/admin podem mudar em Social > Configurações."; senão, a caixa desmarcada por padrão.
- [ ] **Step 4:** Teste passa; `npm run typecheck` passa.
- [ ] **Step 5:** Commit `feat: aprovação do cliente obrigatória no Social conforme configuração`.

### Task 2: Tela de configurações do Social

**Files:**

- Modify: `src/server/actions/social.ts` (nova `updateSocialSettingsAction`)
- Create: `src/app/app/social/configuracoes/page.tsx`, `src/app/app/social/configuracoes/social-settings-form.tsx`
- Modify: `src/app/app/social/page.tsx` (botão "Configurações" só se `isManager`)
- Modify: `tests/unit/supabase-mock.ts` (adicionar `upsert` aos métodos encadeáveis)
- Test: `tests/unit/actions-social.test.ts`

**Interfaces:**

- Produces: `updateSocialSettingsAction(prev: SocialFormState, formData: FormData): Promise<SocialFormState>`; campo `approval_required` = checkbox `"on"`.

- [ ] **Step 1: Testes** (padrão de `actions-team.test.ts`): `member` → `{ error }` e nenhum `upsert` em `social_settings`; `admin` com `approval_required=on` → `upsert({ tenant_id: TENANT, approval_required: true }, { onConflict: "tenant_id" })` e `{ success }`; sem o campo → `approval_required: false`.
- [ ] **Step 2:** Rodar → FAIL.
- [ ] **Step 3:** Implementar action (`isManager`, `dbError("social_settings", error)`, `revalidatePath("/app/social")` e `/app/social/configuracoes`). Página: redireciona `member` para `/app/social`; formulário no padrão de `configuracoes/notification-prefs-form.tsx` com a chave "Exigir aprovação do cliente em todos os posts".
- [ ] **Step 4:** Testes passam.
- [ ] **Step 5:** Commit `feat: tela de configurações do Social (aprovação obrigatória)`.

### Task 3: Avisos de aprovação

**Files:**

- Modify: `src/lib/email-templates.ts` (templates `social_approval_requested`, vars `post`, `company`, `url`; e `social_approval_response`, vars `post`, `decision`, `note`, `url`)
- Create: `src/server/social/approval-notifications.ts`
- Test: `tests/unit/social-approval-notifications.test.ts`

**Interfaces:**

- Produces:
  - `notifyPortalApprovalRequested(input: { tenantId: string; postId: string }): Promise<{ emails: number }>`
  - `notifyStaffPortalResponse(input: { postId: string; companyId: string; approved: boolean; note?: string | null }): Promise<{ notifications: number; emails: number }>`
- Ambos usam `createAdminClient()`, `sendTenantEmail`, `createNotification`; base de URL igual a `src/server/social/reminders.ts`. Resumo do post com até 80 caracteres.

- [ ] **Step 1: Testes:**
  - pedido: consulta `contacts` com `eq("tenant_id")`, `eq("company_id", post.company_id)`, `not("user_id","is",null)`, `is("deleted_at", null)`; e-mail só para contatos com `email`; URL termina em `/portal/social/{postId}`; post inexistente → `{ emails: 0 }` sem e-mail.
  - resposta: com `created_by` → 1 notificação `type: "social_approval_response"` para o autor, URL `/app/social/{postId}`; sem `created_by` → um aviso por owner/admin ativo; `notify_email=false` → notificação sem e-mail; `decision` "aprovou"/"rejeitou"; `note` vazia → "".
  - falha: `sendTenantEmail` lançando → função resolve sem lançar e chama `logger.error`.
- [ ] **Step 2:** Rodar → FAIL.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** Testes passam.
- [ ] **Step 5:** Commit `feat: avisos de aprovação do Social para cliente e equipe`.

### Task 4: Ligar os avisos às actions e atualizar o mapa

**Files:**

- Modify: `src/server/actions/social.ts` (`submitSocialPostAction`, `respondPortalSocialPostAction`)
- Modify: `docs/mapa/06-problemas-e-dividas.md` (#29 resolvido; #20 resolvido no PR #35)
- Test: `tests/unit/actions-social.test.ts`

**Interfaces:**

- Consumes: as duas funções da Task 3.

- [ ] **Step 1: Testes** (mock de `@/server/social/approval-notifications`): envio com update de 1 linha → `notifyPortalApprovalRequested({ tenantId, postId })`; update de 0 linhas → não chama; portal com RPC `{ data: true }` → `notifyStaffPortalResponse({ postId, approved, note })`; `{ data: false }` → não chama.
- [ ] **Step 2:** Rodar → FAIL.
- [ ] **Step 3:** Chamar os avisos com `await` depois de `recordEvent` (envio) e depois do RPC com `data === true` (portal), antes dos `redirect`.
- [ ] **Step 4:** Os 5 comandos do AGENTS.md passam.
- [ ] **Step 5:** Commit `feat: dispara avisos de aprovação do Social` + `docs: atualiza item #29 do mapa`.

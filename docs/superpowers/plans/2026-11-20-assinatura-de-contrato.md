# Assinatura de contrato — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** um contrato do Orbit pode ser enviado por link, assinado pelo cliente com assinatura desenhada e prova de aceite (nome, e-mail, data, IP, UA, hash do conteúdo), e o resultado fica congelado e auditável.

**Architecture:** o link público reusa a infraestrutura de `document_links` (token + hash) já usada por orçamento/fatura; a assinatura vira PNG no bucket `contracts` e o conteúdo com placeholders é resolvido e congelado no aceite. Toda escrita pública passa por server action com rate limit e client admin, depois de validar o token.

**Tech Stack:** Next.js 15 (App Router, server actions), Supabase (Postgres + RLS + Storage), Zod 4, pdf-lib, Vitest.

**Spec:** `docs/perfex/assinatura-de-contrato.md`

## Global Constraints

- Interface e mensagens em pt-BR.
- Toda tabela nova tem `tenant_id` + RLS por `is_tenant_member`; portal lê por RPC `security definer` ou por policy própria de contato.
- Página pública: `robots: noindex`, `referrer: no-referrer`, rate limit por IP.
- Assinatura aceita **apenas** `image/png` até **512 KB** (após decodificar).
- `signed_at` e `content_rendered`/`content_hash` só são escritos no aceite; `marked_as_signed_at` nunca os altera.
- Segunda assinatura no mesmo contrato é no-op idempotente (não sobrescreve data/IP).
- Antes de concluir: `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

## Review Focus

1. **Vazamento entre tenants pelo token** — um token de A não pode renderizar, assinar nem baixar contrato de B; se falhar, é incidente. Coberto em T1 (RLS) e T4 (action).
2. **Duplo clique / reenvio assinando duas vezes** — a segunda chamada deve devolver sucesso sem mudar `signed_at`, IP ou hash. Coberto em T4.
3. **Conteúdo assinado diferente do exibido** — hash do `content_rendered` gravado tem de conferir com o texto salvo, e desfazer assinatura restaura os placeholders. Coberto em T2 e T5.
4. **PNG forjado** (data URL enorme, mime errado, base64 inválido, bytes que não são PNG) — recusar antes de gravar. Coberto em T3.
5. **Contrato invisível no portal vazando** — `not_visible_to_client`/soft delete não podem aparecer para o contato. Coberto em T1 e T8.

---

### Task 1: Migration 0060

**Files:**

- Create: `supabase/migrations/0060_contract_signature.sql`
- Modify: `src/lib/database.types.ts` (gerado)

**Interfaces:**

- Produces: colunas em `contracts`, tabelas `contract_signers` e `contract_events`, `tenants.e_sign_legal_text`, `document_links.rel_type` aceitando `'contract'`.

- [ ] **Step 1: Escrever a migration**

`contracts` ganha: `content text`, `content_rendered text`, `content_hash text`, `signed_at timestamptz`, `signature_path text`, `acceptance_firstname text`, `acceptance_lastname text`, `acceptance_email text`, `acceptance_ip text`, `acceptance_user_agent text`, `marked_as_signed_at timestamptz`, `marked_as_signed_by uuid references profiles(id)`, `last_sent_at timestamptz`, `last_sign_reminder_at timestamptz`, `require_login boolean not null default false`.

`tenants` ganha `e_sign_legal_text text`.

`contract_signers` (id, tenant_id, contract_id FK composta `(contract_id, tenant_id)`, role check `('client','company')`, name, email, signed_at, signature_path, ip, user_agent). Nesta versão há **uma linha por contrato** (`role='client'`), criada no primeiro envio; a tabela existe para co-assinatura futura.

`contract_events` conforme a spec (kind, actor_kind, actor_id, ip, user_agent, metadata jsonb), com FK composta e índice `(contract_id, created_at)`.

`document_links`: dropar o check de `rel_type` e recriar aceitando `('estimate', 'invoice', 'contract')`.

RLS: `contract_signers` e `contract_events` com policy de select para `is_tenant_member` e escrita só por `service_role` (grants: `select` para authenticated, `all` para service_role).

- [ ] **Step 2: Aplicar e regenerar tipos**

Run: `npx supabase db push --linked --yes && npm run db:types`
Expected: `0060_contract_signature.sql` aplicada; `database.types.ts` passa a listar `contract_signers` e `contract_events`.

- [ ] **Step 3: Rodar o RLS local (quando houver Docker)**

Run: `npm run test:rls`
Expected: sem novas falhas (nenhum teste novo ainda).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0060_contract_signature.sql src/lib/database.types.ts
git commit -m "feat(contracts): schema de assinatura, aceite e eventos"
```

---

### Task 2: Template, placeholders e hash

**Files:**

- Create: `src/lib/contracts/template.ts`
- Test: `tests/unit/contract-template.test.ts`

**Interfaces:**

- Produces: `renderContractTemplate(content, vars)`, `hashContractContent(rendered)`, `contractVars(input)`, tipo `ContractVars`.

- [ ] **Step 1: Escrever os testes**

```ts
import {
  contractVars,
  hashContractContent,
  renderContractTemplate,
} from "@/lib/contracts/template"

it("substitui placeholders conhecidos", () => {
  expect(
    renderContractTemplate("Oi {{cliente.nome}}", { "cliente.nome": "ACME" }),
  ).toEqual({ rendered: "Oi ACME", unresolved: [] })
})

it("lista placeholders desconhecidos sem quebrar", () => {
  expect(
    renderContractTemplate("{{x.y}} {{cliente.nome}}", { "cliente.nome": "A" }),
  ).toEqual({ rendered: "{{x.y}} A", unresolved: ["x.y"] })
})

it("tolera espaços dentro das chaves", () => {
  expect(
    renderContractTemplate("{{ cliente.nome }}", { "cliente.nome": "B" })
      .rendered,
  ).toBe("B")
})

it("hash é estável e muda com o conteúdo", () => {
  expect(hashContractContent("abc")).toBe(hashContractContent("abc"))
  expect(hashContractContent("abc")).not.toBe(hashContractContent("abd"))
  expect(hashContractContent("abc")).toMatch(/^[a-f0-9]{64}$/)
})

it("monta as variáveis do contrato", () => {
  expect(
    contractVars({
      tenantName: "Orbit",
      companyName: "ACME",
      companyVat: "1",
      value: 100,
      currency: "BRL",
      startDate: "2026-01-01",
      endDate: null,
      today: "2026-11-20",
    }),
  ).toMatchObject({
    "cliente.nome": "ACME",
    "empresa.nome": "Orbit",
    "contrato.valor": expect.stringContaining("100"),
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tests/unit/contract-template.test.ts`
Expected: FAIL "Cannot find module '@/lib/contracts/template'".

- [ ] **Step 3: Implementar**

`renderContractTemplate(content: string, vars: ContractVars): { rendered: string; unresolved: string[] }` — regex `/\{\{\s*([\w.]+)\s*\}\}/g`; chave ausente fica intacta e entra em `unresolved` (sem duplicatas).
`hashContractContent(rendered: string): string` — `createHash("sha256").update(rendered).digest("hex")`.
`contractVars` — usa `formatMoney`/`formatDate` de `@/lib/format`; chaves: `cliente.nome`, `cliente.documento`, `contrato.valor`, `contrato.inicio`, `contrato.fim`, `empresa.nome`, `data.hoje`.

- [ ] **Step 4: Ver passar**

Run: `npx vitest run tests/unit/contract-template.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/contracts/template.ts tests/unit/contract-template.test.ts
git commit -m "feat(contracts): render de placeholders e hash do conteudo"
```

---

### Task 3: Validação da assinatura (PNG)

**Files:**

- Create: `src/lib/contracts/signature.ts`
- Modify: `src/lib/validations/contracts.ts` (adicionar `signContractSchema`)
- Test: `tests/unit/contract-signature-validation.test.ts`

**Interfaces:**

- Produces: `decodeSignatureDataUrl(value, maxBytes?)` e `signContractSchema`.

- [ ] **Step 1: Escrever os testes**

```ts
import { decodeSignatureDataUrl } from "@/lib/contracts/signature"

const PNG =
  "data:image/png;base64," +
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).toString(
    "base64",
  )

it("aceita PNG válido", () => {
  const out = decodeSignatureDataUrl(PNG)
  expect("bytes" in out && out.bytes.length).toBe(8)
})

it("recusa mime diferente de image/png", () => {
  expect(decodeSignatureDataUrl("data:image/jpeg;base64,AAAA")).toEqual({
    error: "Formato de assinatura inválido.",
  })
})

it("recusa base64 inválido", () => {
  expect("error" in decodeSignatureDataUrl("data:image/png;base64,@@@")).toBe(
    true,
  )
})

it("recusa bytes que não são PNG", () => {
  expect(
    "error" in
      decodeSignatureDataUrl(
        "data:image/png;base64," + Buffer.from("abc").toString("base64"),
      ),
  ).toBe(true)
})

it("recusa acima do limite", () => {
  expect("error" in decodeSignatureDataUrl(PNG, 4)).toBe(true)
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tests/unit/contract-signature-validation.test.ts`
Expected: FAIL (módulo não existe).

- [ ] **Step 3: Implementar**

`decodeSignatureDataUrl(value: string, maxBytes = 512 * 1024)` → `{ bytes: Buffer } | { error: string }`. Confere prefixo `data:image/png;base64,`, base64 estrito (rejeita `@`), tamanho decodificado e os 8 bytes mágicos do PNG.
`signContractSchema` (Zod): `firstname` 1–80, `lastname` até 80 opcional, `email` válido, `signature` string min 1, `consent` literal `true`.

- [ ] **Step 4: Ver passar**

Run: `npx vitest run tests/unit/contract-signature-validation.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/contracts/signature.ts src/lib/validations/contracts.ts tests/unit/contract-signature-validation.test.ts
git commit -m "feat(contracts): validacao da assinatura em PNG"
```

---

### Task 4: Aceite público (`signContractAction`)

**Files:**

- Create: `src/server/actions/contract-signature.ts`
- Test: `tests/unit/actions-contract-signature.test.ts`

**Interfaces:**

- Consumes: `renderContractTemplate`, `hashContractContent`, `contractVars` (T2); `decodeSignatureDataUrl`, `signContractSchema` (T3); `resolveDocumentLink`; `createAdminClient`; `getClientIp`, `isRateLimited`.
- Produces: `signContractAction(input)` usada pela página pública (T6).

- [ ] **Step 1: Escrever os testes**

Mocks no padrão de `tests/unit/actions-public-document.test.ts` (`createSupabaseMock`, `hasCall`). Casos:

1. rate limit estourado → `{ error: "Muitas tentativas. Tente novamente em instantes." }` e nenhuma escrita.
2. token nulo ou `rel_type !== "contract"` → `{ error: "Link inválido ou expirado." }`.
3. contrato já assinado → `{ ok: true }` e **não** há `update` em `contracts`.
4. assinatura inválida → erro de validação e nenhum `storage.upload`.
5. caminho feliz → `storage.from("contracts").upload` chamado com `{tenant}/contracts/{id}/signature-{uuid}.png`, `update` com `signed_at`, `content_rendered`, `content_hash`, `acceptance_ip`, `acceptance_user_agent` e um `insert` em `contract_events` com `kind: "signed"`, `actor_kind: "client"`; `document_links.responded_at` atualizado.

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tests/unit/actions-contract-signature.test.ts`
Expected: FAIL (módulo não existe).

- [ ] **Step 3: Implementar**

`signContractAction(input: { token: string; firstname: string; lastname?: string; email: string; signature: string; consent: boolean }): Promise<{ ok: true } | { error: string }>`.
Ordem: rate limit (`contract:sign:{ip}`, 20, 600) → resolve link → carrega contrato (`id`, `tenant_id`, `company_id`, `content`, `title`, `value`, `currency`, `start_date`, `end_date`, `signed_at`, `deleted_at`) → valida schema → decodifica PNG → resolve placeholders e hash → upload no bucket `contracts` → `update` condicional (`is("signed_at", null)`) com aceite e `signature_path` → se o update não retornou linha, considera já assinado e devolve `{ ok: true }` → insere evento e marca `responded_at`. Erros inesperados passam por `logger.error("contracts.sign_failed", ...)`.

- [ ] **Step 4: Ver passar**

Run: `npx vitest run tests/unit/actions-contract-signature.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/server/actions/contract-signature.ts tests/unit/actions-contract-signature.test.ts
git commit -m "feat(contracts): aceite publico com assinatura e prova"
```

---

### Task 5: Envio, desfazer e marcar assinado (staff)

**Files:**

- Modify: `src/server/actions/contracts.ts`
- Modify: `src/lib/email-templates.ts` (`contract_sent`)
- Test: `tests/unit/actions-contracts-signature.test.ts`

**Interfaces:**

- Consumes: `createDocumentLink`, `sendTenantEmail`, `loadContractView` (T7, se já existir; senão usa o PDF de T7 na T8).
- Produces: `sendContractForSignatureAction({ id, contactIds, message? })`, `clearContractSignatureAction(id)`, `markContractSignedAction(id)`.

- [ ] **Step 1: Escrever os testes**

1. `sendContract...` recusa contrato de outro tenant e contrato já assinado; no caminho feliz cria link (`rel_type: "contract"`), envia e-mail para os contatos do cliente, grava `last_sent_at` e evento `sent`.
2. `clearContractSignatureAction` só para owner/admin; apaga o objeto do Storage, limpa aceite e `signed_at`, grava evento `unsigned`.
3. `markContractSignedAction` grava `marked_as_signed_at/by` e evento `marked_signed` **sem** tocar `signed_at`/`content_hash`.
4. `contract_sent` existe em `EMAIL_TEMPLATES` com `{{link}}`, `{{number}}`/`{{tenant}}` e assunto padrão.

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tests/unit/actions-contracts-signature.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar**

Seguir o formato de `sendDocumentAction` (contatos do cliente, máximo 20, revoga link quando nenhum e-mail sai). Link expira em 30 dias. `clear...` busca `signature_path` antes do update para remover do bucket; `content_rendered`/`content_hash` voltam a `null`. `mark...` aceita contrato já assinado (é selo separado) e grava metadata `{ source: "paper" }`.

- [ ] **Step 4: Ver passar**

Run: `npx vitest run tests/unit/actions-contracts-signature.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/server/actions/contracts.ts src/lib/email-templates.ts tests/unit/actions-contracts-signature.test.ts
git commit -m "feat(contracts): envio para assinatura, desfazer e selo de papel"
```

---

### Task 6: Página pública `/c/[token]` e canvas

**Files:**

- Create: `src/server/document-sharing/contract-view.ts`
- Create: `src/app/c/[token]/page.tsx`
- Create: `src/app/c/[token]/sign-form.tsx`
- Test: `tests/unit/contract-sign-form.test.tsx`

**Interfaces:**

- Consumes: `resolveDocumentLink`, `signContractAction` (T4).
- Produces: `loadContractView(admin, tenantId, contractId)` → `ContractView` (usada também no T7).

- [ ] **Step 1: Escrever o teste do componente**

Com `@testing-library/react`: o botão "Assinar contrato" começa desabilitado; habilita só com nome, e-mail e traço registrado (prop `hasStroke`). Renderizar `SignForm` com um `action` mockado.

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tests/unit/contract-sign-form.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementar**

`loadContractView`: contrato por `id`+`tenant_id`, `deleted_at is null`; retorna título, conteúdo (**`content_rendered ?? content ?? description`**), valor, datas, status, `signedAt`, `acceptance*`, `legalText` do tenant, empresa e marca do tenant. Nunca expõe `note`/`admin_note`.
Página: rate limit `contract:view:{ip}` (60, 600), atualiza `last_viewed_at`, grava evento `viewed` (uma vez por visualização, sem spam: só quando `last_viewed_at` tem mais de 1 h), `noindex`. Renderiza conteúdo em `whitespace-pre-wrap`; se `signed_at`, mostra comprovante (imagem do bucket via URL assinada, nome, e-mail, data, IP, hash curto). Se não assinado, `<SignForm token>`.
`SignForm` (client): inputs, canvas com pointer events, limpar, `toDataURL("image/png")`, chama `signContractAction`, mostra erro/sucesso e `router.refresh()`.

- [ ] **Step 4: Ver passar**

Run: `npx vitest run tests/unit/contract-sign-form.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/server/document-sharing/contract-view.ts "src/app/c/[token]" tests/unit/contract-sign-form.test.tsx
git commit -m "feat(contracts): pagina publica de assinatura"
```

---

### Task 7: PDF do contrato

**Files:**

- Create: `src/server/document-sharing/contract-pdf.ts`
- Create: `src/app/c/[token]/pdf/route.ts`
- Modify: `src/server/document-sharing/pdf.ts` (exportar `embedLogo` e `hexToRgb`)
- Test: `tests/unit/contract-pdf.test.ts`

**Interfaces:**

- Consumes: `ContractView` (T6).
- Produces: `renderContractPdf(view): Promise<Uint8Array>` e `contractPdfResponse(view)`.

- [ ] **Step 1: Escrever o teste**

Gera o PDF de uma `ContractView` fake com e sem assinatura; espera bytes começando em `%PDF`, nome de arquivo `Contrato-<numero>.pdf` e, no caso assinado, que o texto contenha o nome do signatário (extrair texto não é trivial: basta verificar que `renderContractPdf` resolve sem `throw` e que o tamanho é maior que 1 KB).

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tests/unit/contract-pdf.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar**

Reusa `embedLogo`/`hexToRgb` (exportados) e o helper de quebra de linha local. Cabeçalho com marca + "CONTRATO", número, datas; corpo do contrato; bloco de assinatura com imagem embutida quando assinado (baixada do Storage via URL assinada curta) + nome, e-mail, data e hash curto; rodapé igual ao dos outros PDFs.

- [ ] **Step 4: Ver passar**

Run: `npx vitest run tests/unit/contract-pdf.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/server/document-sharing/contract-pdf.ts "src/app/c/[token]/pdf" src/server/document-sharing/pdf.ts tests/unit/contract-pdf.test.ts
git commit -m "feat(contracts): pdf com bloco de assinatura"
```

---

### Task 8: Telas internas e portal

**Files:**

- Modify: `src/app/app/contratos/page.tsx`
- Create: `src/app/app/contratos/[id]/page.tsx` (detalhe com ações)
- Modify: `src/app/app/contratos/contract-form-dialog.tsx` (campo `content`)
- Modify: `src/server/queries/contracts.ts` (novos campos + `listPortalContracts`)
- Modify: `src/app/portal/(portal)/contratos/page.tsx` (link para detalhe)
- Create: `src/app/portal/(portal)/contratos/[id]/page.tsx`
- Test: `tests/unit/contracts-queries.test.ts` (garantir que `listPortalContracts` filtra `deleted_at` e `not_visible_to_client` se existir)

**Interfaces:**

- Consumes: actions de T5, `loadContractView` (T6).

- [ ] **Step 1: Escrever o teste de query**

`listPortalContracts` recebe `companyId` e devolve só contratos da empresa, não excluídos, ordenados por `end_date` desc.

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tests/unit/contracts-queries.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar**

Lista interna: coluna "Assinatura" (selo **Aguardando · Assinado em dd/mm · Assinado no papel**), botões enviar/editar/excluir, link para detalhe.
Detalhe: conteúdo, histórico de eventos, comprovante, ações (enviar, desfazer assinatura, marcar assinado no papel, baixar PDF).
Formulário: textarea `content` com dica dos placeholders.
Portal: lista com status de assinatura e página de detalhe somente leitura + botão **Assinar** quando pendente (reusa `SignForm`).

- [ ] **Step 4: Ver passar**

Run: `npx vitest run tests/unit/contracts-queries.test.ts`
Expected: PASS.

- [ ] **Step 5: Verificação manual**

Run: `npm run dev` e abrir `/app/contratos` e `/portal/contratos`.
Expected: criar contrato, enviar, abrir link em aba anônima, assinar e ver o selo mudar.

- [ ] **Step 6: Commit**

```bash
git add src/app/app/contratos src/app/portal/\(portal\)/contratos src/server/queries/contracts.ts tests/unit/contracts-queries.test.ts
git commit -m "feat(contracts): telas de assinatura no app e no portal"
```

---

### Task 9: Verificação final e documentação

**Files:**

- Modify: `docs/mapa/03-funcionalidades.md` (linha de contratos)
- Modify: `supabase/migrations/0061_roadmap_contract_signature.sql` (marcar o item do roadmap como `in_progress`)

- [ ] **Step 1: Rodar a suíte completa**

Run: `npm run format:check && npm run lint && npm run typecheck && npm test && npm run build`
Expected: tudo verde.

- [ ] **Step 2: Atualizar roadmap e mapa**

Migration `0061` com `update roadmap_items set status='in_progress' where title='Assinatura eletrônica de contratos'`; ficha 03 passa a descrever contrato com assinatura.

- [ ] **Step 3: Commit**

```bash
git add docs/mapa/03-funcionalidades.md supabase/migrations/0061_roadmap_contract_signature.sql
git commit -m "docs: contrato com assinatura no mapa e roadmap"
```

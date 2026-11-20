# Envio de documentos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enviar orçamento e fatura por e-mail com PDF anexo e link público onde o cliente vê o documento e aceita ou recusa o orçamento sem login.

**Architecture:** Um loader (`loadDocument`) recebe o client Supabase e monta os dados do documento: o client do usuário no app, o admin na página pública depois de validar o token. Um gerador `pdf-lib` transforma esses dados em PDF. Os links ficam em `document_links`, só com o hash do token. O envio é uma server action, a página pública fica em `/d/[token]` e o aceite é uma server action com update condicional.

**Tech Stack:** Next.js 15, Supabase, pdf-lib, Resend (API HTTP), Vitest.

**Spec:** `docs/superpowers/specs/2026-11-20-envio-documentos-design.md`

## Global Constraints

- Token: 32 bytes aleatórios em base64url. No banco, só o `sha256` hex em `token_hash`.
- Validade: orçamento até 23:59:59 de `expiry_date` em `APP_TIME_ZONE` (sem validade: +30 dias); fatura: +90 dias.
- Status: orçamento 1 → 2 ao enviar; fatura 6 → 1 ao enviar. Aceite público só com `status = 2` (update condicional) e link não expirado nem revogado.
- Mensagens para o usuário via `UserFacingError`/textos em português; erros de banco por `dbError`.
- Datas com `formatDate`; dinheiro com `formatMoney`.

## Review Focus

- Orçamento vencido (`expiry_date` passado) com link ainda válido → não mostra Aceitar (teste na Task 4).
- Dois cliques em Aceitar → o segundo não muda nada e mostra o resultado atual (teste na Task 4).
- Contato sem e-mail, ou de outro cliente, enviado no formulário → recusado (teste na Task 3).
- Resend sem chave → mensagem "E-mail não configurado" e status inalterado (teste na Task 3).
- Documento sem itens ou com acentos/símbolos (ç, ã, €) → PDF gera sem erro (teste na Task 2).

---

### Task 1: Links de documento (migration + tokens)

**Files:** Create `supabase/migrations/0058_document_links.sql`, `src/server/documents/links.ts`; modify `src/lib/database.types.ts`; tests `tests/unit/document-links.test.ts`, `tests/rls/isolation.test.ts`.

**Produces:**
- `generateLinkToken(): { token: string; hash: string }`, `hashLinkToken(token: string): string`
- `linkExpiry(kind: DocumentKind, expiryDate: string | null, now?: Date): string` (ISO)
- `createDocumentLink(supabase, input: { tenantId; kind; docId; expiryDate: string | null; userId: string | null }): Promise<{ token: string } | { error: string }>`
- `resolveDocumentLink(admin, token: string, now?: Date): Promise<{ id; tenant_id; rel_type: DocumentKind; rel_id; expires_at } | null>` (null se o hash não existe, se expirou ou se foi revogado)

- [ ] Testes: o token tem 43 caracteres base64url e o hash é o sha256 hex; tokens diferentes a cada chamada; `linkExpiry("estimate","2026-12-19")` = `2026-12-20T02:59:59.999Z`; sem validade, +30 dias; fatura +90; `resolveDocumentLink` devolve null para expirado, revogado ou inexistente e consulta por `token_hash`. RLS: owner A lê/cria links de A; B não lê os de A; anon não lê nada.
- [ ] FAIL → implementar → PASS. Commit `feat: links públicos de documento (tokens com hash e validade)`.

### Task 2: Dados do documento e PDF

**Files:** Create `src/server/documents/load.ts`, `src/server/documents/pdf.ts`, `src/app/app/orcamentos/[id]/pdf/route.ts`, `src/app/app/faturas/[id]/pdf/route.ts`; test `tests/unit/document-pdf.test.ts`.

**Produces:**
- `type DocumentView = { kind; id; number; status; date; dueOrExpiry: string | null; currency; subtotal; discountTotal; totalTax; adjustment; total; paid: number; clientNote; terms; items: DocumentItem[]; company: { name; vat; address; city; state; zip; country } | null; tenant: { name; logoUrl: string | null; primaryColor: string | null } }`
- `loadDocument(supabase, tenantId: string, kind: DocumentKind, id: string): Promise<DocumentView | null>`
- `renderDocumentPdf(view: DocumentView): Promise<Uint8Array>` (Helvetica WinAnsi; caracteres fora do WinAnsi trocados por `?`; logo PNG/JPEG baixado da URL pública, ignorado se falhar)
- `documentFileName(view): string` (ex. `Orcamento-EST-000001.pdf`)

- [ ] Testes: o PDF começa com `%PDF`, com acentos e "€"; sem itens não lança; o nome do arquivo de fatura é `Fatura-INV-000001.pdf`; o loader soma `payments` em `paid` e devolve null para documento de outro tenant (mock).
- [ ] FAIL → implementar → PASS. Rotas `GET` exigem membro ativo (`getActiveMembership`) e respondem `application/pdf` com `Content-Disposition: attachment`. Commit `feat: PDF de orçamento e fatura`.

### Task 3: Enviar ao cliente

**Files:** Modify `src/lib/email.ts` (attachments), `src/server/email.ts`, `src/lib/email-templates.ts` (templates `estimate_sent` e `invoice_sent`, vars `tenant`, `number`, `total`, `date`, `link`, `message`); create `src/server/actions/send-document.ts`, `src/components/app/send-document-dialog.tsx`; modify the detail pages for estimates and invoices (button + PDF link); test `tests/unit/actions-send-document.test.ts`.

**Produces:** `sendDocumentAction(input: { kind: DocumentKind; id: string; contactIds: string[]; message?: string }): Promise<{ error?: string; success?: string; sent?: number }>`

- [ ] Testes: sem empresa → erro; contato de outro cliente ou sem e-mail → `{ error: "Selecione contatos deste cliente com e-mail." }`; envio ok → 1 link criado, `sendTenantEmail` uma vez por contato com `attachments[0].filename` igual ao nome do PDF, status 1→2 (orçamento) e 6→1 (fatura); um destinatário falhando não impede o outro, e `sent` conta só os enviados; Resend sem chave (`skipped`) → `{ error: "E-mail não configurado. Configure o Resend para enviar documentos." }` e status inalterado.
- [ ] FAIL → implementar → PASS. A janela lista os contatos com e-mail (o principal marcado) e uma mensagem opcional. Commit `feat: enviar orçamento e fatura ao cliente por e-mail`.

### Task 4: Página pública e aceite

**Files:** Create `src/app/d/[token]/page.tsx`, `src/app/d/[token]/pdf/route.ts`, `src/app/d/[token]/respond-buttons.tsx`, `src/server/actions/public-document.ts`; test `tests/unit/actions-public-document.test.ts`.

**Produces:** `respondPublicEstimateAction(token: string, accept: boolean): Promise<{ status: number } | { error: string }>`

- [ ] Testes: token inválido → `{ error: "Link inválido ou expirado." }`; link de fatura → erro; status ≠ 2 → devolve o status atual sem update; orçamento vencido → `{ error: "Este orçamento venceu." }`; aceite → update com `.eq("status", 2)` para 4 (recusa → 3) e grava `responded_at`; rate limit por IP (`isRateLimited("doc:ip:<ip>", 20, 600)`).
- [ ] FAIL → implementar → PASS. A página registra `last_viewed_at` e mostra Aceitar/Recusar só com status 2 dentro da validade. Commit `feat: página pública do documento com aceite do orçamento`.

### Task 5: Verificação

- [ ] Navegador local: enviar o orçamento à Marina, abrir o link (pego no `email_log`/teste) sem login, baixar o PDF, aceitar, conferir "Aceito" no app.
- [ ] Os 5 checks do AGENTS.md e `test:rls` local. Atualizar o item da issue no PR.

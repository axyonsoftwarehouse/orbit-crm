# Assinatura eletrônica de contrato — especificação de porte (Perfex 3.4.1 → Orbit)

> Fase 2 do plano C. Evidências em `perfex crm/` (extração 3.4.1).
> Relacionado: [`paridade-perfex-3.4.1.md`](../paridade-perfex-3.4.1.md) (§5, P0),
> [`propostas.md`](propostas.md) — mesma infraestrutura de aceite, aplicada a outro documento.

## 1. O que é (e por que é P0)

Contrato no Orbit hoje é CRUD: título, descrição, valor e vigência. Não há prova de que o cliente
aceitou. Sem aceite registrado, o contrato não serve para cobrar nem para defender a empresa. O
Perfex resolve com assinatura no link público + registro de identidade, data e IP, e **congela o
conteúdo assinado**.

## 2. Como o Perfex faz

### 2.1 Dados (`tblcontracts`)

| Campo                                                       | Papel                                            |
| ----------------------------------------------------------- | ------------------------------------------------ |
| `hash`, `short_link`                                        | link público do contrato                         |
| `content`                                                   | corpo do contrato, com _merge fields_            |
| `signed`                                                    | 1 quando o cliente assinou                       |
| `signature`                                                 | nome do arquivo PNG em `uploads/contracts/{id}/` |
| `marked_as_signed`                                          | 1 quando a equipe marca "assinado no papel"      |
| `acceptance_firstname/lastname/email/date/ip`               | prova de aceite                                  |
| `last_sent_at`, `contacts_sent_to`, `last_sign_reminder_at` | envio e cobrança de assinatura                   |
| `not_visible_to_client`, `trash`, `isexpirynotified`        | visibilidade e avisos                            |

### 2.2 Fluxo de assinatura

`Contract::index($id, $hash)` — link público; se `view_contract_only_logged_in = 1`, exige login do
contato.

1. O cliente desenha a assinatura em canvas.
2. `process_digital_signature_image()` decodifica o base64 e grava `signature.png`
   (nome único) no diretório do contrato, registrando o nome do arquivo.
3. `add_signature()`:
   - resolve os _merge fields_ (`override_merge_fields`) e **salva o conteúdo resolvido** em
     `content` — o contrato assinado não muda se o cliente for renomeado depois;
   - grava `get_acceptance_info_array()`: nome, sobrenome, e-mail, data/hora, IP;
   - `signed = 1`;
   - notifica o criador do contrato.
4. `clear_signature()` desfaz: `signed = 0`, apaga o PNG, **restaura os merge fields** no conteúdo e
   limpa os dados de aceite.

`marked_as_signed()` é separado: marca que a equipe recebeu o contrato assinado fora do sistema.
**Não** grava aceite nem assinatura; é só um selo operacional.

### 2.3 Texto legal e identidade

- `e_sign_legal_text` (Configurações → E-sign) é o texto exibido junto à assinatura.
- Propostas e orçamentos têm confirmação de identidade **opcional**
  (`proposal_accept_identity_confirmation`, `estimate_accept_identity_confirmation`).
- Contrato **sempre** pede confirmação (o controller força `identity_confirmation_enabled = true`).

### 2.4 Envio e lembretes

- Envio por e-mail com PDF anexo, para contatos selecionados (`contacts_sent_to`).
- Lembrete de assinatura usa `last_sign_reminder_at`.
- Aviso de expiração usa `isexpirynotified`.

### 2.5 Limites observados

- **Um assinante** (o contato que abriu o link). Não há co-assinatura nem ordem de assinatura.
- Não há trilha de auditoria além do aceite (sem histórico de visualizações).
- O PNG não é embutido no PDF automaticamente no ato; o PDF passa a mostrar a assinatura porque lê
  o campo.
- Não há verificação de integridade do conteúdo assinado (hash).

## 3. Regras a portar (com as correções)

| #   | Regra                                   | Perfex      | Orbit deve                                       |
| --- | --------------------------------------- | ----------- | ------------------------------------------------ |
| R1  | Link público por token                  | ✅ (`hash`) | ✅ (`document_links`)                            |
| R2  | Assinatura desenhada → PNG              | ✅          | ✅ (canvas → storage)                            |
| R3  | Aceite grava nome, e-mail, data, IP     | ✅          | ✅ + `user_agent`                                |
| R4  | Conteúdo assinado é congelado           | ✅          | ✅ + `content_hash` (SHA-256)                    |
| R5  | Desfazer assinatura restaura o conteúdo | ✅          | ✅                                               |
| R6  | Marcar "assinado no papel" sem aceite   | ✅          | ✅ (campo separado, nunca confunde com `signed`) |
| R7  | Texto legal configurável                | ✅          | ✅ por tenant                                    |
| R8  | Exigir login do contato (opcional)      | ✅          | ✅ opção por tenant                              |
| R9  | Aviso de expiração                      | ✅          | ✅ (cron de lembretes)                           |
| R10 | Assinatura visível no PDF               | ✅          | ✅ (bloco com imagem, nome, data, IP)            |
| R11 | Trilha de auditoria (quem viu, quando)  | ❌          | ✅ `contract_events`                             |
| R12 | Hash do conteúdo assinado               | ❌          | ✅                                               |

## 4. Proposta para o Orbit

### 4.1 Banco

```sql
alter table public.contracts
  add column if not exists content text,             -- corpo com placeholders
  add column if not exists content_rendered text,    -- congelado no aceite
  add column if not exists content_hash text,        -- sha256 do rendered
  add column if not exists signed_at timestamptz,
  add column if not exists signature_path text,
  add column if not exists acceptance_firstname text,
  add column if not exists acceptance_lastname text,
  add column if not exists acceptance_email text,
  add column if not exists acceptance_ip text,
  add column if not exists acceptance_user_agent text,
  add column if not exists marked_as_signed_at timestamptz,
  add column if not exists marked_as_signed_by uuid references public.profiles (id) on delete set null,
  add column if not exists last_sent_at timestamptz,
  add column if not exists last_sign_reminder_at timestamptz,
  add column if not exists require_login boolean not null default false;

create table public.contract_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  contract_id uuid not null,
  kind text not null check (kind in ('created', 'sent', 'viewed', 'signed', 'unsigned', 'marked_signed', 'reminder')),
  actor_kind text not null check (actor_kind in ('staff', 'client', 'system')),
  actor_id uuid,
  ip text,
  user_agent text,
  metadata jsonb,
  created_at timestamptz not null default now(),
  constraint contract_events_contract_fk foreign key (contract_id, tenant_id)
    references public.contracts (id, tenant_id) on delete cascade
);
```

- `document_links.rel_type` ganha `'contract'` (token público).
- `tenants`: `e_sign_legal_text text` (default vazio).
- Bucket: `contracts` (ou reaproveitar `documents`) com caminho `{tenant}/{contract}/signature.png`.

Placeholders do contrato (subconjunto dos merge fields do Perfex):
`{{cliente.nome}}`, `{{cliente.documento}}`, `{{contrato.valor}}`, `{{contrato.inicio}}`,
`{{contrato.fim}}`, `{{empresa.nome}}`, `{{data.hoje}}`. Resolução no servidor, no momento do
aceite; o que ficar não resolvido fica visível e é registrado em `metadata`.

### 4.2 Server actions (`src/server/actions/contracts.ts`, ampliando o existente)

| Action                                                  | Regra                                                                                                                    |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `sendContractForSignatureAction`                        | e-mail com link + PDF; atualiza `last_sent_at`; evento `sent`                                                            |
| `signContractAction` (pública, por token)               | valida token/status; exige nome + e-mail + assinatura; grava PNG, rendered + hash, aceite e evento `signed`; idempotente |
| `clearContractSignatureAction`                          | só owner/admin; apaga PNG; `signed_at = null`; restaura `content_rendered`; evento `unsigned`                            |
| `markContractSignedAction`                              | exige arquivo assinado anexado; grava `marked_as_signed_*`; **não** mexe em `signed_at`                                  |
| `addContractCommentAction` / `attachContractFileAction` | hoje ausentes; entram junto                                                                                              |

### 4.3 Link público (`/c/[token]`)

Layout de leitura: cabeçalho da empresa, título, partes, conteúdo renderizado, valores e vigência,
botão **Baixar PDF**. Abaixo, quando não assinado, o bloco de assinatura:

- campos nome, sobrenome e e-mail (pré-preenchidos se o contato estiver logado);
- canvas de assinatura (pointer events, limpar, confirmar);
- `e_sign_legal_text` do tenant;
- botão **Assinar contrato** (desabilitado até nome, e-mail e traço existirem).

Depois de assinado, o bloco vira o comprovante: imagem, nome, e-mail, data/hora, IP e hash curto.

### 4.4 PDF e portal

- PDF do contrato passa a existir (hoje só fatura/orçamento têm): conteúdo + bloco de assinatura.
- Portal `/portal/contratos/[id]`: mesma visão, com botão assinar quando pendente.
- Lista de contratos mostra selo: **Aguardando assinatura · Assinado em dd/mm · Assinado no papel ·
  Vencido**.

### 4.5 Validação (Zod)

`contractSchema` (existente +): `content?`, `require_login`.
`signContractSchema`: `token`, `firstname` (1–80), `lastname?`, `email`,
`signature` (data URL `image/png`, ≤ 512 KB), `consent` (boolean obrigatório).

## 5. Decisões que precisam do seu aval

1. **Peso legal**: canvas + IP/UA + hash é o padrão do mercado "e-sign simples", mas não substitui
   assinatura com certificado (ICP-Brasil). Se precisar disso, o caminho é provedor
   (Clicksign/Assinafy/DocuSign) e a spec muda de "construir" para "integrar".
2. **Um assinante ou vários**: o Perfex tem um. Co-assinatura (representante legal + testemunha) é
   comum em contrato de agência — se for requisito, o modelo precisa de tabela `contract_signers`
   desde o início.
3. **Login obrigatório**: Perfex permite exigir. Recomendo **não** exigir por padrão (link com token
   é o que o cliente espera) e deixar a opção por tenant.
4. **PDF**: gerar no servidor com `pdf-lib` (já usado) — a assinatura entra como imagem; sem
   dependência nova.
5. **Retenção**: guardar o PNG indefinidamente ou só o hash + rendered? Recomendo guardar ambos (a
   imagem é a prova).

## 6. Testes

Unitários (`tests/unit/contract-signature.test.ts`):

- aceite grava os oito campos e é idempotente (segundo POST não altera data/hora/IP);
- hash do conteúdo confere com o rendered salvo;
- desfazer limpa assinatura, restaura conteúdo e mantém histórico em `contract_events`;
- `marked_as_signed` não define `signed_at`;
- placeholder desconhecido é registrado em `metadata` e não quebra o render.

RLS (`tests/rls/contracts.test.ts`):

- token de um tenant não abre contrato de outro;
- portal não lê contrato com `not_visible_to_client`;
- `contract_events` só é legível por membros do tenant.

## 7. Fora de escopo

- Provedor de assinatura com certificado digital.
- Múltiplos assinantes e ordem de assinatura (avaliar na decisão 2).
- Reconhecimento facial / prova de vida.
- Carimbo do tempo (timestamp authority).

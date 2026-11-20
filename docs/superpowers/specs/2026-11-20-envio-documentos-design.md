# Envio de orçamento e fatura por e-mail, com PDF e link público (issue #46)

## Por quê

No teste de 19/11/2026, orçamento e fatura não tinham "Enviar ao cliente", PDF
nem link. "Enviado" era um status manual e o cliente precisava entrar no portal,
que exige login. A maioria dos clientes de uma agência nunca terá acesso ao
portal. O objetivo é o cliente receber o documento por e-mail e, no caso do
orçamento, **aceitar ou recusar online sem login**.

## Decisão (opção B)

E-mail com o **PDF anexo** e um **link público seguro** (token secreto com
validade). O link abre uma página sem login com o documento, o download do PDF
e, para orçamento enviado, os botões Aceitar/Recusar.

Descartadas: A (link para o portal), porque não serve a quem não tem login; C
(só PDF), porque o aceite volta a ser manual.

## Objetivos

1. **PDF** de orçamento e fatura com `pdf-lib` (mesma lib do relatório de SEO):
   logo e cor do tenant, número, datas (`formatDate`), cliente (nome, CNPJ,
   endereço), itens (descrição, qtd, valor, imposto, total), subtotal,
   desconto, impostos, ajuste, total, observações (`client_note`) e termos.
   Fatura também mostra pago e em aberto (de `payments`).
   - Download no app: `GET /app/orcamentos/[id]/pdf` e `/app/faturas/[id]/pdf`
     (membro do tenant).
   - Download público: `GET /d/[token]/pdf`.
2. **Enviar ao cliente**: botão no detalhe do orçamento e da fatura que abre
   uma janela com os contatos do cliente que têm e-mail (o principal marcado),
   mais uma mensagem opcional. A action:
   - valida o membro, se o documento é do tenant e se os contatos são do cliente
     do documento e têm e-mail;
   - cria um link (token) para o documento;
   - gera o PDF uma vez e envia um e-mail por destinatário (modelos
     `estimate_sent` / `invoice_sent`, editáveis em Configurações > E-mails),
     com o PDF anexo e o link;
   - orçamento em Rascunho (1) passa a Enviado (2); fatura em Rascunho (6)
     passa a Em aberto (1);
   - devolve quantos e-mails saíram. Sem Resend configurado, avisa e não muda
     status.
3. **Página pública `/d/[token]`**: mostra o documento com a marca do tenant e
   o link do PDF. Para orçamento com status Enviado e dentro da validade:
   Aceitar e Recusar. Depois da resposta, mostra o resultado e não oferece os
   botões de novo. Token inválido, expirado ou revogado mostra "Link inválido
   ou expirado".
4. **Aceite público**: server action que valida o token e grava o aceite com
   **update condicional** (`status = 2`, igual à regra do portal na `0056`). A
   página registra o primeiro acesso (`last_viewed_at`).

## Modelo de dados (migration `0058`)

Tabela `document_links`: `id`, `tenant_id`, `rel_type` (`estimate`|`invoice`),
`rel_id`, `token_hash` (sha-256, único), `expires_at`, `created_by`,
`created_at`, `revoked_at`, `last_viewed_at`, `responded_at`.

- Só o hash é guardado; o token (32 bytes aleatórios, base64url) só existe no
  e-mail.
- Validade: orçamento até o fim do dia de `expiry_date`, ou 30 dias se não
  houver; fatura 90 dias.
- RLS ligada. Membros do tenant leem e criam links do próprio tenant. Anon não
  tem acesso; a página pública lê pelo client admin no servidor, depois de
  validar o hash (fluxo controlado, como o web-to-lead).

## Fora do escopo

- Notificar a agência do aceite/recusa: entra na #47 junto com o portal.
- Pagamento online (Pix/boleto): backlog.
- Assinatura eletrônica, rastreio de abertura do e-mail, envio agendado.
- Listar e revogar links pela tela (o modelo já tem `revoked_at`).

## O que não pode acontecer

- Token adivinhável, ou o token aparecendo em log ou no banco.
- Aceitar orçamento que não está Enviado, que venceu ou de outro tenant.
- O link de um documento mostrar outro documento.
- A falha de um destinatário impedir os demais; o status muda se pelo menos
  um e-mail sair.
- Mostrar `cost`/`notes` internos ou dados de outro cliente na página pública.

## Testes

- Unitários: geração e hash de token e validade; action de envio (permissão,
  contatos de outro cliente recusados, status, contagem, sem Resend); aceite
  público (token inválido/expirado/revogado, status ≠ 2, update condicional);
  PDF (gera bytes `%PDF`, com acentos e sem itens).
- RLS: `document_links` isolado entre tenants e fechado para anon.
- Navegador local: enviar, abrir o link sem login, baixar o PDF, aceitar, e ver
  o orçamento "Aceito" no app.

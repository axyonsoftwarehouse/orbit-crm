# Gateway de pagamento — especificação de porte (Perfex 3.4.1 → Orbit)

> Fase 2 do plano C. Evidências em `perfex crm/` (extração 3.4.1).
> Relacionado: [`paridade-perfex-3.4.1.md`](../paridade-perfex-3.4.1.md) (§3, P0),
> [`notas-de-credito.md`](notas-de-credito.md), [`recorrencia.md`](recorrencia.md).

## 1. O que é (e por que é P0)

A fatura existe, o cliente recebe o PDF, e para pagar precisa sair do sistema. O Perfex resolve com
métodos de pagamento configuráveis: os **offline** (dinheiro, transferência) o staff registra, os
**online** (gateway) o cliente paga no link público e o pagamento entra sozinho por webhook.

## 2. Como o Perfex faz

### 2.1 Dados

| Tabela                     | Papel                                                                                                                        |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `tblpayment_modes`         | catálogo de métodos: `name`, `description`, `show_on_pdf`, `invoices_only`, `expenses_only`, `selected_by_default`, `active` |
| `tblpayment_attempts`      | tentativa aberta: `reference`, `invoice_id`, `amount`, `fee`, `payment_gateway`, `created_at`                                |
| `tblinvoicepaymentrecords` | pagamento efetivado: valor, data, método, transação, nota                                                                    |
| `tbloptions`               | credenciais do gateway (`paymentmethod_{id}_{chave}`), cifradas                                                              |

Métodos online não têm id numérico: o "id" é o slug do gateway (`stripe`, `paypal`, `mollie`…).
Métodos offline são numéricos. É essa diferença que roteia o `process_payment`.

### 2.2 Fluxo

```text
cliente abre /invoice/{id}/{hash}
  escolhe método  →  POST make_payment
    Payments_model::process_payment
      offline (id numérico)  → registra pagamento (staff)
      online  (slug)         → cria payment_attempt (reference, amount, fee)
                               amount += taxa do gateway
                               gateway->process_payment(data)  → redireciona ao checkout
  provedor                    → webhook
    checkout.session.completed → retrieve payment intent
      payments_model->transaction_exists(id, invoice) ? ignora : addPayment(...)
      addPayment desconta a taxa da tentativa e apaga a tentativa
      update_invoice_status
```

### 2.3 Regras observadas

- **Taxa do gateway** (`fee_percent` + `fee_fixed`) é **somada ao valor cobrado** e **subtraída** do
  valor registrado. O cliente paga R$ 100 + R$ 3,99; a fatura recebe R$ 100.
- **Idempotência** por `transactionid` + `invoiceid` (`transaction_exists`).
- Valor a pagar pode ser editado pelo cliente se `allow_payment_amount_to_be_modified = 1`; senão é
  travado no saldo devedor.
- Webhook do Stripe trata também assinatura recorrente (`customer.subscription.*`), porque o módulo
  de assinaturas usa o mesmo gateway.
- O pagamento registrado dispara e-mail de recibo e atualiza o status da fatura.
- Credenciais ficam em `tbloptions`, cifradas com a chave da aplicação (`encryption->decrypt`).

### 2.4 Gateways disponíveis no Perfex

Stripe, Stripe iDEAL, PayPal (padrão), PayPal Checkout, Braintree, Mollie, Authorize.Net Accept.js,
2Checkout, PayU Money, Instamojo. Todos seguem a mesma interface `App_gateway`
(`getId`, `getFee`, `process_payment`, `addPayment`).

## 3. Regras a portar (com as correções)

| #   | Regra                                             | Perfex                       | Orbit deve              |
| --- | ------------------------------------------------- | ---------------------------- | ----------------------- |
| R1  | Métodos offline + online no mesmo catálogo        | ✅                           | ✅                      |
| R2  | Taxa somada ao cobrado e descontada do registrado | ✅                           | ✅                      |
| R3  | Tentativa criada antes do redirect                | ✅                           | ✅                      |
| R4  | Idempotência por transação                        | ✅                           | ✅ (+ índice único)     |
| R5  | Webhook confirma valor e fatura                   | parcial                      | ✅ valida valor e moeda |
| R6  | Credenciais cifradas                              | ✅ (global)                  | ✅ por tenant, no Vault |
| R7  | Método por fatura (quais aparecem)                | ✅ (`allowed_payment_modes`) | ✅ por fatura           |
| R8  | Pagamento parcial pelo gateway                    | ✅ (se permitido)            | ✅ opção por tenant     |
| R9  | Estorno pelo sistema                              | ❌                           | ❌ (fica para depois)   |
| R10 | Conciliação de tentativa abandonada               | ❌ (tentativa fica órfã)     | ✅ expira em 24 h       |

## 4. Proposta para o Orbit

### 4.1 Provedores

Começar com **dois**, atrás de uma interface comum:

| Provedor         | Por quê                                                               | Formato                                         |
| ---------------- | --------------------------------------------------------------------- | ----------------------------------------------- |
| **Mercado Pago** | Pix é o meio mais usado no Brasil; cobre Pix, boleto e cartão         | Checkout Pro (redirect) + Pix (QR/copia-e-cola) |
| **Stripe**       | cartão internacional, Checkout hospedado, bom para cliente fora do BR | Checkout Session (redirect)                     |

Os dois são **redirect/QR hospedado**: o Orbit nunca vê dado de cartão (fora do escopo PCI).

### 4.2 Banco

```sql
create table public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  kind text not null check (kind in ('offline', 'stripe', 'mercadopago')),
  label text not null,
  active boolean not null default true,
  show_on_pdf boolean not null default false,
  invoices_only boolean not null default true,
  selected_by_default boolean not null default true,
  fee_percent numeric(5,2) not null default 0,
  fee_fixed numeric(15,2) not null default 0,
  credentials_id uuid,          -- id do segredo no Vault
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, kind)
);

create table public.payment_attempts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  invoice_id uuid not null,
  payment_method_id uuid not null references public.payment_methods (id) on delete cascade,
  reference text not null unique,
  amount numeric(15,2) not null check (amount > 0),
  fee numeric(15,2) not null default 0,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'failed', 'expired')),
  external_id text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  constraint payment_attempts_invoice_fk foreign key (invoice_id, tenant_id)
    references public.invoices (id, tenant_id) on delete cascade
);

alter table public.payments
  add column if not exists payment_method_id uuid references public.payment_methods (id) on delete set null,
  add column if not exists attempt_id uuid references public.payment_attempts (id) on delete set null,
  add column if not exists external_id text;

create unique index if not exists payments_external_id_key
  on public.payments (tenant_id, external_id)
  where external_id is not null;
```

Credenciais no Vault, seguindo o padrão já usado no Social (`social_store_tokens`):

```sql
-- security definer, revogado de anon/authenticated
payment_store_credentials(p_tenant uuid, p_method uuid, p_payload jsonb)
payment_get_credentials(p_method uuid) returns jsonb
payment_clear_credentials(p_method uuid)
```

### 4.3 Servidor

```text
src/server/payments/
  providers/types.ts        -- interface: createCheckout, verifyWebhook, parseEvent
  providers/stripe.ts
  providers/mercadopago.ts
  attempts.ts               -- cria/expira tentativa, calcula taxa
  webhook.ts                -- valida assinatura, aplica evento, idempotência
```

Interface mínima:

```ts
type Provider = {
  createCheckout(input: {
    invoice: Invoice
    amount: number
    reference: string
    successUrl: string
    cancelUrl: string
    credentials: Credentials
  }): Promise<{ redirectUrl?: string; pixPayload?: string; externalId: string }>
  verifyWebhook(req: Request, credentials: Credentials): boolean
  parseEvent(payload: unknown): {
    reference: string
    externalId: string
    amount: number
    currency: string
    status: "paid" | "failed"
  }
}
```

### 4.4 Rotas

| Rota                                    | Papel                                                      |
| --------------------------------------- | ---------------------------------------------------------- |
| `POST /api/payments/checkout`           | autenticada, cria tentativa e devolve URL/QR               |
| `POST /api/payments/webhook/[provider]` | pública, valida assinatura, registra pagamento             |
| `GET /api/payments/return`              | retorno do cliente: confirma estado e redireciona à fatura |

Webhook: sempre **200** em eventos irrelevantes (para o provedor parar de reenviar), **401** em
assinatura inválida, e **nunca** confiar no valor do evento sem comparar com a tentativa.

### 4.5 Registro do pagamento

```text
ao receber "paid":
  localiza tentativa por reference
  se status = paid            → ignora (idempotente)
  se |event.amount − attempt.amount| > 0,01 → registra failed e alerta
  cria payments { invoice_id, amount: attempt.amount − attempt.fee,
                  payment_method_id, external_id, attempt_id, date: hoje }
  attempt.status = paid
  recalcula status da fatura (pagamentos + créditos, como nas notas de crédito)
  envia recibo
```

### 4.6 Interface

- `/app/configuracoes/pagamentos` — métodos offline (nome, taxa, aparece no PDF), conectar Stripe e
  Mercado Pago (chaves, test/live), testar conexão.
- Na fatura: seção **Pagamentos** com tentativas pendentes e histórico.
- No link público `/d/[token]` e no portal: botão **Pagar** quando há método online ativo e saldo;
  Pix mostra QR e código copia-e-cola.
- Na fatura PDF: nomes dos métodos marcados com `show_on_pdf`, como o Perfex.

### 4.7 Validação e segurança

- Zod em todas as entradas; valor recalculado no servidor a partir da fatura e da tentativa.
- Chaves só no Vault; nunca em `select` para o cliente (RLS + coluna `credentials_id`).
- Webhook valida HMAC (Stripe) / assinatura (Mercado Pago) antes de qualquer escrita.
- Rate limit no checkout (reaproveitar `rate_limit_hits`).
- Sem dado de cartão no banco: se o provedor devolver bandeira/últimos dígitos, guardar só isso.

## 5. Decisões que precisam do seu aval

1. **Qual provedor primeiro**: recomendo **Mercado Pago** (Pix muda a conversão no Brasil) e Stripe
   em seguida. Fazer os dois no mesmo ciclo dobra o escopo de webhook e teste.
2. **Taxa repassada ao cliente**: o Perfex sempre soma. Recomendo manter ligado/desligado por
   método, com padrão desligado (cliente paga o valor da fatura).
3. **Pagamento parcial**: permitir (como o Perfex) ou só o saldo total? Recomendo permitir, com
   mínimo configurável.
4. **Pix**: exige confirmação por webhook; o QR expira (30 min típico). Definir se a tela faz
   _polling_ (a cada 5 s) ou espera o webhook com "atualize a página".
5. **Moeda**: Mercado Pago opera em BRL; Stripe aceita a moeda da fatura. Enquanto o Orbit é
   moeda única por tenant, não há conflito — vale registrar a limitação.

## 6. Testes

Unitários (`tests/unit/payments.test.ts`):

- taxa percentual + fixa arredonda em 2 casas;
- valor cobrado = fatura + taxa; valor registrado = fatura;
- webhook duplicado não cria segundo pagamento;
- valor divergente é rejeitado e a tentativa vira `failed`;
- tentativa expirada não aceita pagamento;
- assinatura de webhook inválida retorna 401 sem escrever.

RLS (`tests/rls/payments.test.ts`):

- tenant A não lê método nem tentativa do B;
- cliente do portal não consegue criar checkout para fatura de outro tenant;
- `credentials_id` não aparece em nenhuma resposta do cliente.

Integração (manual, com sandbox): Pix de ponta a ponta no Mercado Pago e cartão de teste no Stripe.

## 7. Fora de escopo

- Estorno pelo sistema (o provedor faz; depois registramos à mão).
- Assinatura recorrente com cobrança automática (outro item do roadmap: "Cobrança automática").
- Boleto registrado próprio, antifraude, split de pagamento.
- Guardar cartão (tokenização) para cobrança futura.

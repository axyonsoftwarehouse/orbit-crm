/**
 * Regras puras da visão 360° do cliente: totais financeiros, horas e a linha
 * do tempo que junta o histórico do lead convertido com a auditoria.
 */

/** Faturas que não contam para "a receber" nem "recebido". */
const IGNORED_INVOICE_STATUSES = new Set([5, 6]) // cancelada, rascunho
/** Faturas com saldo em aberto. */
const OPEN_INVOICE_STATUSES = new Set([1, 3]) // em aberto, parcial

export type FinanceInvoice = {
  id: string
  status: number
  total: number
  due_date: string | null
}

export type FinancePayment = { invoice_id: string; amount: number }

export type ClientFinance = {
  receivable: number
  received: number
  overdueCount: number
}

export function summarizeFinance(
  invoices: FinanceInvoice[],
  payments: FinancePayment[],
  today: string,
): ClientFinance {
  const paidByInvoice = new Map<string, number>()
  for (const payment of payments) {
    paidByInvoice.set(
      payment.invoice_id,
      (paidByInvoice.get(payment.invoice_id) ?? 0) + Number(payment.amount),
    )
  }

  let receivable = 0
  let received = 0
  let overdueCount = 0
  for (const invoice of invoices) {
    if (IGNORED_INVOICE_STATUSES.has(invoice.status)) continue
    const paid = paidByInvoice.get(invoice.id) ?? 0
    received += paid
    if (!OPEN_INVOICE_STATUSES.has(invoice.status)) continue
    const due = Math.max(Number(invoice.total) - paid, 0)
    receivable += due
    if (due > 0 && invoice.due_date !== null && invoice.due_date < today) {
      overdueCount += 1
    }
  }

  return {
    receivable: round2(receivable),
    received: round2(received),
    overdueCount,
  }
}

function round2(value: number) {
  return Math.round(value * 100) / 100
}

/** Soma as durações (segundos) e devolve horas com uma casa decimal. */
export function sumHours(
  entries: { duration_seconds: number | null }[],
): number {
  const seconds = entries.reduce(
    (total, entry) => total + (entry.duration_seconds ?? 0),
    0,
  )
  return Math.round((seconds / 3600) * 10) / 10
}

export function formatHours(hours: number): string {
  return `${hours.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} h`
}

const ENTITY_LABELS: Record<string, { label: string; base: string | null }> = {
  companies: { label: "cliente", base: "/app/clientes" },
  contacts: { label: "contato", base: null },
  projects: { label: "projeto", base: "/app/projetos" },
  invoices: { label: "fatura", base: "/app/faturas" },
  payments: { label: "pagamento", base: null },
  estimates: { label: "orçamento", base: "/app/orcamentos" },
  contracts: { label: "contrato", base: "/app/contratos" },
  tickets: { label: "ticket", base: "/app/tickets" },
}

const ACTION_LABELS: Record<string, string> = {
  insert: "criou",
  update: "atualizou",
  delete: "excluiu",
}

export type AuditEntry = {
  id: string
  entity: string
  entity_id: string | null
  action: string
  created_at: string
  actor_name: string | null
}

export type LeadNote = {
  id: string
  lead_id: string
  description: string
  created_at: string
  author_name: string | null
}

export type ConvertedLead = {
  id: string
  name: string
  converted_at: string | null
}

export type TimelineItem = {
  id: string
  kind: "note" | "audit" | "conversion"
  at: string
  author: string | null
  text: string
  href: string | null
}

/**
 * Junta anotações do lead, a conversão em cliente e a auditoria dos
 * documentos do cliente, do mais recente para o mais antigo.
 */
export function buildTimeline(
  input: {
    leads: ConvertedLead[]
    notes: LeadNote[]
    audit: AuditEntry[]
    /** Rótulo legível por entity_id (ex.: "FAT-0003"). */
    names?: Map<string, string>
  },
  limit = 50,
): TimelineItem[] {
  const items: TimelineItem[] = []

  for (const note of input.notes) {
    items.push({
      id: `note:${note.id}`,
      kind: "note",
      at: note.created_at,
      author: note.author_name,
      text: note.description,
      href: `/app/leads/${note.lead_id}`,
    })
  }

  for (const lead of input.leads) {
    if (!lead.converted_at) continue
    items.push({
      id: `conversion:${lead.id}`,
      kind: "conversion",
      at: lead.converted_at,
      author: null,
      text: `Lead "${lead.name}" convertido em cliente`,
      href: `/app/leads/${lead.id}`,
    })
  }

  for (const entry of input.audit) {
    const config = ENTITY_LABELS[entry.entity]
    if (!config) continue
    const action = ACTION_LABELS[entry.action] ?? entry.action
    const name = entry.entity_id ? input.names?.get(entry.entity_id) : null
    const href =
      config.base && entry.entity_id && entry.action !== "delete"
        ? `${config.base}/${entry.entity_id}`
        : null
    items.push({
      id: `audit:${entry.id}`,
      kind: "audit",
      at: entry.created_at,
      author: entry.actor_name,
      text: `${capitalize(action)} ${config.label}${name ? ` ${name}` : ""}`,
      href,
    })
  }

  return items
    .sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0))
    .slice(0, limit)
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** Divide uma lista em blocos (para filtros `in` sem URLs gigantes). */
export function chunk<T>(list: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size))
  return out
}

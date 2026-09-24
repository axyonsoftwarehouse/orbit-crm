export const APP_NAME = "Orbit CRM"

export const TENANT_COOKIE = "orbit.tenant"

export const ROLES = ["owner", "admin", "member"] as const
export type Role = (typeof ROLES)[number]

export const PROJECT_STATUSES = {
  1: { label: "Não iniciado", color: "#64748b" },
  2: { label: "Em andamento", color: "#2563eb" },
  3: { label: "Em espera", color: "#f97316" },
  4: { label: "Concluído", color: "#16a34a" },
  5: { label: "Cancelado", color: "#94a3b8" },
} as const

export type ProjectStatus = keyof typeof PROJECT_STATUSES

export const PROJECT_BILLING_TYPES = {
  1: { label: "Valor fixo" },
  2: { label: "Por hora (projeto)" },
  3: { label: "Por hora (tarefa)" },
} as const

export type ProjectBillingType = keyof typeof PROJECT_BILLING_TYPES

export const TASK_STATUSES = {
  1: { label: "Não iniciada", color: "#64748b" },
  2: { label: "Aguardando retorno", color: "#84cc16" },
  3: { label: "Em teste", color: "#0284c7" },
  4: { label: "Em andamento", color: "#3b82f6" },
  5: { label: "Concluída", color: "#22c55e" },
} as const

export type TaskStatus = keyof typeof TASK_STATUSES

export const TASK_PRIORITIES = {
  1: { label: "Baixa", color: "#777777" },
  2: { label: "Média", color: "#03a9f4" },
  3: { label: "Alta", color: "#ff6f00" },
  4: { label: "Urgente", color: "#fc2d42" },
} as const

export type TaskPriority = keyof typeof TASK_PRIORITIES

export const ESTIMATE_STATUSES = {
  1: { label: "Rascunho", color: "#64748b" },
  2: { label: "Enviado", color: "#2563eb" },
  3: { label: "Recusado", color: "#ef4444" },
  4: { label: "Aceito", color: "#16a34a" },
  5: { label: "Expirado", color: "#f97316" },
} as const

export type EstimateStatus = keyof typeof ESTIMATE_STATUSES

export const INVOICE_STATUSES = {
  1: { label: "Em aberto", color: "#f59e0b" },
  2: { label: "Pago", color: "#16a34a" },
  3: { label: "Parcial", color: "#2563eb" },
  5: { label: "Cancelada", color: "#94a3b8" },
  6: { label: "Rascunho", color: "#64748b" },
} as const

export type InvoiceStatus = keyof typeof INVOICE_STATUSES

export const PAYMENT_MODES = [
  "Pix",
  "Transferência",
  "Boleto",
  "Cartão",
  "Dinheiro",
  "Outro",
] as const

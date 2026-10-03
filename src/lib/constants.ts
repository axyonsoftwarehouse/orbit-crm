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

export const MILESTONE_STATUSES = {
  1: { label: "Pendente", color: "#64748b" },
  2: { label: "Em andamento", color: "#2563eb" },
  3: { label: "Concluído", color: "#16a34a" },
} as const

export type MilestoneStatus = keyof typeof MILESTONE_STATUSES

export const MILESTONE_COLORS = [
  "#0062FF",
  "#FFC542",
  "#50B5FF",
  "#3DD598",
  "#FF974A",
  "#FF5A5A",
  "#A461D8",
] as const

export const TAG_COLORS = MILESTONE_COLORS

export const CUSTOM_FIELD_TYPES = {
  text: { label: "Texto" },
  textarea: { label: "Texto longo" },
  number: { label: "Número" },
  date: { label: "Data" },
  select: { label: "Seleção" },
  checkbox: { label: "Checkbox" },
} as const

export type CustomFieldType = keyof typeof CUSTOM_FIELD_TYPES

export const CUSTOM_FIELD_ENTITIES = {
  company: { label: "Clientes" },
  project: { label: "Projetos" },
  task: { label: "Tarefas" },
  lead: { label: "Leads" },
} as const

export type CustomFieldEntity = keyof typeof CUSTOM_FIELD_ENTITIES

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

export const TICKET_STATUSES = {
  1: { label: "Aberto", color: "#0062ff" },
  2: { label: "Pendente", color: "#ffc542" },
  3: { label: "Em andamento", color: "#50b5ff" },
  4: { label: "Resolvido", color: "#3dd598" },
  5: { label: "Fechado", color: "#92929d" },
  6: { label: "Cancelado", color: "#fc5a5a" },
} as const

export type TicketStatus = keyof typeof TICKET_STATUSES

export const TICKET_PRIORITIES = {
  1: { label: "Baixa", color: "#92929d" },
  2: { label: "Média", color: "#50b5ff" },
  3: { label: "Alta", color: "#ff974a" },
  4: { label: "Crítica", color: "#fc5a5a" },
} as const

export type TicketPriority = keyof typeof TICKET_PRIORITIES

export const TICKET_TYPES = {
  1: { label: "Bug" },
  2: { label: "Solicitação" },
  3: { label: "Dúvida" },
  4: { label: "Incidente" },
} as const

export type TicketType = keyof typeof TICKET_TYPES

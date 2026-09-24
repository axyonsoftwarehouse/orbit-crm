export const DEFAULT_LEAD_STATUSES = [
  {
    name: "Novo",
    color: "#92929d",
    position: 0,
    is_default: true,
    is_won: false,
    is_lost: false,
  },
  {
    name: "Contatado",
    color: "#50b5ff",
    position: 1,
    is_default: false,
    is_won: false,
    is_lost: false,
  },
  {
    name: "Qualificado",
    color: "#0062ff",
    position: 2,
    is_default: false,
    is_won: false,
    is_lost: false,
  },
  {
    name: "Proposta",
    color: "#ffc542",
    position: 3,
    is_default: false,
    is_won: false,
    is_lost: false,
  },
  {
    name: "Ganho",
    color: "#3dd598",
    position: 4,
    is_default: false,
    is_won: true,
    is_lost: false,
  },
  {
    name: "Perdido",
    color: "#fc5a5a",
    position: 5,
    is_default: false,
    is_won: false,
    is_lost: true,
  },
] as const

export const DEFAULT_LEAD_SOURCES = [
  "Site",
  "Indicação",
  "Google",
  "Facebook",
  "Instagram",
  "Evento",
  "Outro",
] as const

export const DEFAULT_DEPARTMENTS = [
  "Suporte Técnico",
  "Comercial",
  "Financeiro",
] as const

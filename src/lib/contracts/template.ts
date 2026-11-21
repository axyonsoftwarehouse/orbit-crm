import { createHash } from "node:crypto"
import { formatDate, formatMoney } from "@/lib/format"

/** Valores disponíveis nos placeholders do corpo do contrato. */
export type ContractVars = Record<string, string>

export type ContractTemplateResult = {
  rendered: string
  /** Placeholders sem valor, na ordem em que aparecem (sem repetição). */
  unresolved: string[]
}

const PLACEHOLDER = /\{\{\s*([\w.]+)\s*\}\}/g

/**
 * Troca `{{chave}}` pelo valor. Chave desconhecida fica intacta no texto e
 * entra em `unresolved`, para o operador ver o que faltou em vez de assinar um
 * contrato com buraco invisível.
 */
export function renderContractTemplate(
  content: string,
  vars: ContractVars,
): ContractTemplateResult {
  const unresolved: string[] = []

  const rendered = content.replace(PLACEHOLDER, (match, key: string) => {
    if (Object.hasOwn(vars, key)) return vars[key]
    if (!unresolved.includes(key)) unresolved.push(key)
    return match
  })

  return { rendered, unresolved }
}

/** Hash do conteúdo efetivamente assinado (sha-256, hexadecimal). */
export function hashContractContent(rendered: string): string {
  return createHash("sha256").update(rendered).digest("hex")
}

type ContractVarsInput = {
  tenantName: string
  companyName: string | null
  companyVat: string | null
  value: number | null
  currency: string
  startDate: string | null
  endDate: string | null
  /** Data de hoje em ISO (`YYYY-MM-DD`). */
  today: string
}

/** Converte o contrato + tenant nas variáveis dos placeholders. */
export function contractVars(input: ContractVarsInput): ContractVars {
  return {
    "empresa.nome": input.tenantName,
    "cliente.nome": input.companyName ?? "",
    "cliente.documento": input.companyVat ?? "",
    "contrato.valor":
      input.value === null ? "" : formatMoney(input.value, input.currency),
    "contrato.inicio": input.startDate ? formatDate(input.startDate) : "",
    "contrato.fim": input.endDate ? formatDate(input.endDate) : "",
    "data.hoje": formatDate(input.today),
  }
}

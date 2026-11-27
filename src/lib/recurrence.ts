/**
 * Regra de datas das faturas recorrentes. Toda ocorrência é calculada a
 * partir da data do modelo (não da anterior), para o dia não "escorregar":
 * um modelo de 31/01 gera 28/02 (ou 29/02), 31/03, 30/04...
 */

export const RECURRENCE_INTERVALS = {
  1: { label: "Mensal" },
  3: { label: "Trimestral" },
  12: { label: "Anual" },
} as const

export type RecurrenceInterval = keyof typeof RECURRENCE_INTERVALS

export function isRecurrenceInterval(
  value: unknown,
): value is RecurrenceInterval {
  return value === 1 || value === 3 || value === 12
}

/** Máximo de ocorrências geradas por modelo numa execução (recupera atrasos). */
export const MAX_OCCURRENCES_PER_RUN = 12

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/

function parseIso(iso: string): [number, number, number] {
  const match = ISO.exec(iso)
  if (!match) throw new Error(`Data inválida: ${iso}`)
  return [Number(match[1]), Number(match[2]), Number(match[3])]
}

function toIso(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

/** Soma meses mantendo o dia, limitado ao último dia do mês de destino. */
export function addMonthsClamped(iso: string, months: number): string {
  const [year, month, day] = parseIso(iso)
  const index = year * 12 + (month - 1) + months
  const targetYear = Math.floor(index / 12)
  const targetMonth = (index % 12) + 1
  return toIso(
    targetYear,
    targetMonth,
    Math.min(day, daysInMonth(targetYear, targetMonth)),
  )
}

/** Diferença em dias entre duas datas `YYYY-MM-DD` (b − a). */
export function diffDays(a: string, b: string): number {
  const [ya, ma, da] = parseIso(a)
  const [yb, mb, db] = parseIso(b)
  return Math.round(
    (Date.UTC(yb, mb - 1, db) - Date.UTC(ya, ma - 1, da)) / 86_400_000,
  )
}

function addDays(iso: string, days: number): string {
  const [year, month, day] = parseIso(iso)
  const date = new Date(Date.UTC(year, month - 1, day + days))
  return toIso(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate())
}

/** Data da n-ésima ocorrência (n ≥ 1) de um modelo. */
export function occurrenceDate(
  templateDate: string,
  intervalMonths: number,
  sequence: number,
): string {
  return addMonthsClamped(templateDate, intervalMonths * sequence)
}

export type RecurrenceTemplate = {
  date: string
  due_date: string | null
  recurrence_interval_months: number
  recurrence_end_date: string | null
}

export type Occurrence = {
  sequence: number
  date: string
  due_date: string | null
}

/**
 * Ocorrências que já deveriam existir (data ≤ hoje) depois da última gerada,
 * respeitando a data final e o limite por execução. O vencimento mantém a
 * mesma distância (em dias) que o modelo tem entre emissão e vencimento.
 */
export function dueOccurrences(
  template: RecurrenceTemplate,
  lastSequence: number,
  today: string,
  max = MAX_OCCURRENCES_PER_RUN,
): Occurrence[] {
  const interval = template.recurrence_interval_months
  if (!isRecurrenceInterval(interval)) return []

  const dueOffset =
    template.due_date !== null
      ? diffDays(template.date, template.due_date)
      : null

  const out: Occurrence[] = []
  for (let sequence = lastSequence + 1; out.length < max; sequence++) {
    const date = occurrenceDate(template.date, interval, sequence)
    if (date > today) break
    if (template.recurrence_end_date && date > template.recurrence_end_date)
      break
    out.push({
      sequence,
      date,
      due_date: dueOffset === null ? null : addDays(date, dueOffset),
    })
  }
  return out
}

/** Próxima data prevista (para exibir no modelo), ou null se acabou. */
export function nextOccurrenceDate(
  template: RecurrenceTemplate,
  lastSequence: number,
): string | null {
  const interval = template.recurrence_interval_months
  if (!isRecurrenceInterval(interval)) return null
  const date = occurrenceDate(template.date, interval, lastSequence + 1)
  if (template.recurrence_end_date && date > template.recurrence_end_date)
    return null
  return date
}

export type RecurrenceValues = {
  recurrence_interval_months: RecurrenceInterval | null
  recurrence_end_date: string | null
  recurrence_auto_send: boolean
}

/**
 * Lê os campos de recorrência do formulário da fatura. Sem intervalo, a
 * fatura não é recorrente (e os demais campos são zerados).
 */
export function parseRecurrenceInput(
  raw: { interval: unknown; endDate: unknown; autoSend: unknown },
  invoiceDate: string,
): { values: RecurrenceValues } | { error: string } {
  const intervalText = typeof raw.interval === "string" ? raw.interval : ""
  if (!intervalText) {
    return {
      values: {
        recurrence_interval_months: null,
        recurrence_end_date: null,
        recurrence_auto_send: false,
      },
    }
  }

  const interval = Number(intervalText)
  if (!isRecurrenceInterval(interval)) {
    return { error: "Escolha uma recorrência válida." }
  }

  const endText = typeof raw.endDate === "string" ? raw.endDate.trim() : ""
  if (endText && !ISO.test(endText)) {
    return { error: "Data final da recorrência inválida." }
  }
  if (endText && endText <= invoiceDate) {
    return { error: "A recorrência deve terminar depois da data da fatura." }
  }

  return {
    values: {
      recurrence_interval_months: interval,
      recurrence_end_date: endText || null,
      recurrence_auto_send: raw.autoSend === "on" || raw.autoSend === "true",
    },
  }
}

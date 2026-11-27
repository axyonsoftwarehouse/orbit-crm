import {
  APP_TIME_ZONE,
  formatDateTime,
  todayIso,
  addDaysIso,
} from "@/lib/format"
import { zonedTimeToUtc } from "@/lib/timezone"

export const LEAD_ACTIVITY_TYPES = {
  note: { label: "Nota" },
  call: { label: "Ligação" },
  meeting: { label: "Reunião" },
  email: { label: "E-mail" },
  whatsapp: { label: "WhatsApp" },
} as const

export type LeadActivityType = keyof typeof LEAD_ACTIVITY_TYPES

export function isLeadActivityType(value: unknown): value is LeadActivityType {
  return typeof value === "string" && value in LEAD_ACTIVITY_TYPES
}

export function leadActivityTypeLabel(type: string | null | undefined) {
  return isLeadActivityType(type) ? LEAD_ACTIVITY_TYPES[type].label : "Nota"
}

export type NextStepValues = {
  next_step_at: string | null
  next_step_note: string | null
}

/**
 * Lê o próximo passo do formulário (`datetime-local`, no fuso do Brasil) e
 * devolve o instante em UTC. Sem data, não há próximo passo (a nota é
 * ignorada).
 */
export function parseNextStepInput(
  input: { at: unknown; note: unknown },
  timeZone: string = APP_TIME_ZONE,
): { values: NextStepValues } | { error: string } {
  const at = typeof input.at === "string" ? input.at.trim() : ""
  const note = typeof input.note === "string" ? input.note.trim() : ""
  if (!at) return { values: { next_step_at: null, next_step_note: null } }

  const instant = zonedTimeToUtc(at, timeZone)
  if (!instant || Number.isNaN(instant.getTime())) {
    return { error: "Data do próximo passo inválida." }
  }
  if (note.length > 500) {
    return { error: "A nota do próximo passo deve ter até 500 caracteres." }
  }
  return {
    values: {
      next_step_at: instant.toISOString(),
      next_step_note: note || null,
    },
  }
}

/** Fim do dia de hoje (meia-noite seguinte) no fuso informado, em UTC. */
export function endOfTodayUtc(
  now: Date = new Date(),
  timeZone: string = APP_TIME_ZONE,
): string {
  const tomorrow = addDaysIso(todayIso(now, timeZone), 1)
  return (zonedTimeToUtc(`${tomorrow}T00:00`, timeZone) as Date).toISOString()
}

/** "Hoje às 14:30", "Amanhã às 09:00" ou "05/12/2026 às 10:00". */
export function formatNextStep(
  value: string,
  now: Date = new Date(),
  timeZone: string = APP_TIME_ZONE,
): string {
  const day = todayIso(new Date(value), timeZone)
  const today = todayIso(now, timeZone)
  const time = formatDateTime(value, { timeStyle: "short" }, timeZone)
  if (day === today) return `Hoje às ${time}`
  if (day === addDaysIso(today, 1)) return `Amanhã às ${time}`
  if (day === addDaysIso(today, -1)) return `Ontem às ${time}`
  const date = formatDateTime(value, { dateStyle: "short" }, timeZone)
  return `${date} às ${time}`
}

export function isNextStepOverdue(value: string, now: Date = new Date()) {
  return new Date(value).getTime() < now.getTime()
}

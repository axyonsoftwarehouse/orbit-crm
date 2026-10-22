export type CalendarMonth = {
  year: number
  month: number
}

export const MONTH_NAMES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
] as const

export const WEEKDAY_NAMES = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
] as const

export function parseMonth(
  value: string | string[] | undefined,
): CalendarMonth {
  const raw = Array.isArray(value) ? value[0] : value
  if (raw && /^\d{4}-\d{2}$/.test(raw)) {
    const [year, month] = raw.split("-").map(Number)
    if (month >= 1 && month <= 12) return { year, month }
  }

  const now = new Date()
  return { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 }
}

export function monthKey({ year, month }: CalendarMonth): string {
  return `${year}-${String(month).padStart(2, "0")}`
}

export function addMonths(
  { year, month }: CalendarMonth,
  delta: number,
): CalendarMonth {
  const date = new Date(Date.UTC(year, month - 1 + delta, 1))
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 }
}

export function monthRange({ year, month }: CalendarMonth): {
  start: string
  end: string
} {
  const start = new Date(Date.UTC(year, month - 1, 1))
  const end = new Date(Date.UTC(year, month, 1))
  return { start: start.toISOString(), end: end.toISOString() }
}

export function monthLabel({ year, month }: CalendarMonth): string {
  return `${MONTH_NAMES[month - 1]} de ${year}`
}

export type CalendarDay = {
  key: string
  day: number
  inMonth: boolean
  date: Date
}

export function buildCalendarDays({
  year,
  month,
}: CalendarMonth): CalendarDay[] {
  const first = new Date(Date.UTC(year, month - 1, 1))
  const startOffset = first.getUTCDay()
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const total = Math.ceil((startOffset + daysInMonth) / 7) * 7
  const start = new Date(Date.UTC(year, month - 1, 1 - startOffset))

  return Array.from({ length: total }, (_, index) => {
    const date = new Date(start)
    date.setUTCDate(start.getUTCDate() + index)
    return {
      key: date.toISOString().slice(0, 10),
      day: date.getUTCDate(),
      inMonth: date.getUTCMonth() === month - 1,
      date,
    }
  })
}

export function dateKey(value: string): string {
  return new Date(value).toISOString().slice(0, 10)
}

export function formatMoney(
  value: number | null | undefined,
  currency = "BRL",
) {
  if (value === null || value === undefined) return "—"
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency,
    }).format(Number(value))
  } catch {
    return `${currency} ${Number(value).toFixed(2)}`
  }
}

/**
 * Fuso usado para exibir datas e calcular "hoje". Fixo no Brasil para que
 * servidor (UTC na Vercel) e navegador mostrem o mesmo dia e horário.
 */
export const APP_TIME_ZONE = "America/Sao_Paulo"

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/

/**
 * Data para exibição (dd/mm/aaaa). Data pura (`YYYY-MM-DD`, colunas `date`)
 * sai como foi gravada, sem conversão de fuso; timestamps são convertidos
 * para `timeZone` (padrão: Brasil).
 */
export function formatDate(
  value: string | null | undefined,
  timeZone: string = APP_TIME_ZONE,
) {
  if (!value) return "—"
  const dateOnly = DATE_ONLY.exec(value)
  if (dateOnly) return `${dateOnly[3]}/${dateOnly[2]}/${dateOnly[1]}`
  return new Date(value).toLocaleDateString("pt-BR", { timeZone })
}

/** Data e hora para exibição, no fuso do Brasil por padrão. */
export function formatDateTime(
  value: string | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    dateStyle: "short",
    timeStyle: "short",
  },
  timeZone: string = APP_TIME_ZONE,
) {
  if (!value) return "—"
  return new Date(value).toLocaleString("pt-BR", { ...options, timeZone })
}

/** Dia de hoje (`YYYY-MM-DD`) no fuso informado, para defaults e comparações. */
export function todayIso(
  now: Date = new Date(),
  timeZone: string = APP_TIME_ZONE,
): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now)
  const read = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? ""
  return `${read("year")}-${read("month")}-${read("day")}`
}

/**
 * Chave de dia (`YYYY-MM-DD`) para agrupar: data pura passa direto e
 * timestamp vira o dia no fuso informado.
 */
export function toDateKey(
  value: string,
  timeZone: string = APP_TIME_ZONE,
): string {
  if (DATE_ONLY.test(value)) return value
  return todayIso(new Date(value), timeZone)
}

/** Soma `days` a uma data pura (`YYYY-MM-DD`), sem passar por fuso. */
export function addDaysIso(iso: string, days: number): string {
  const [year, month, day] = iso.split("-").map(Number)
  const date = new Date(Date.UTC(year, month - 1, day + days))
  return date.toISOString().slice(0, 10)
}

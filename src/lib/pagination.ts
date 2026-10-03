export const PAGE_SIZE = 20

export function parsePage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed >= 1 ? Math.floor(parsed) : 1
}

export function nextAuditAt(days: number, from = new Date()): string | null {
  if (days <= 0) return null

  const next = new Date(from)
  next.setUTCDate(next.getUTCDate() + days)
  return next.toISOString()
}

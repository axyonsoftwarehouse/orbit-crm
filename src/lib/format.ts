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

export function formatDate(value: string | null | undefined) {
  return value ? new Date(value).toLocaleDateString("pt-BR") : "—"
}

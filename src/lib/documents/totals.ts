export type LineItemInput = {
  description: string
  qty: number
  rate: number
  unit?: string | null
  tax_name?: string | null
  tax_rate?: number | null
}

export type TotalsInput = {
  discount_type: "before_tax" | "after_tax"
  discount_percent?: number | null
  discount_total?: number | null
  adjustment?: number | null
}

export type Totals = {
  subtotal: number
  total_tax: number
  discount_total: number
  total: number
}

function round(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function computeTotals(
  items: LineItemInput[],
  input: TotalsInput,
): Totals {
  const subtotal = round(
    items.reduce((sum, item) => sum + item.qty * item.rate, 0),
  )

  let totalTax = 0
  for (const item of items) {
    if (item.tax_rate && item.tax_rate > 0) {
      totalTax += ((item.qty * item.rate) / 100) * item.tax_rate
    }
  }
  totalTax = round(totalTax)

  let discount = 0
  if (input.discount_type === "before_tax") {
    discount = input.discount_percent
      ? (subtotal * input.discount_percent) / 100
      : (input.discount_total ?? 0)
    discount = round(discount)
    const ratio = subtotal > 0 ? (subtotal - discount) / subtotal : 1
    totalTax = round(totalTax * ratio)
  } else {
    discount = input.discount_percent
      ? ((subtotal + totalTax) * input.discount_percent) / 100
      : (input.discount_total ?? 0)
    discount = round(discount)
  }

  const total = round(subtotal + totalTax - discount + (input.adjustment ?? 0))

  return { subtotal, total_tax: totalTax, discount_total: discount, total }
}

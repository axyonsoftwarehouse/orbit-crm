/** Links de contato em um clique: e-mail, ligação e WhatsApp. */

export function mailtoHref(email: string | null | undefined): string | null {
  const value = email?.trim()
  if (!value || !value.includes("@")) return null
  return `mailto:${value}`
}

export function telHref(phone: string | null | undefined): string | null {
  const value = phone?.trim()
  if (!value) return null
  const digits = value.replace(/\D/g, "")
  if (digits.length < 8) return null
  return `tel:${value.startsWith("+") ? "+" : ""}${digits}`
}

/**
 * Número no formato do WhatsApp (só dígitos, com DDI). Número brasileiro sem
 * DDI (10 ou 11 dígitos, com DDD) recebe o 55; zero de longa distância sai.
 */
export function whatsappNumber(
  phone: string | null | undefined,
): string | null {
  const value = phone?.trim()
  if (!value) return null
  let digits = value.replace(/\D/g, "")
  if (!value.startsWith("+")) {
    digits = digits.replace(/^0+/, "")
    if (digits.length === 10 || digits.length === 11) digits = `55${digits}`
  }
  if (digits.length < 10 || digits.length > 15) return null
  return digits
}

export function whatsappHref(phone: string | null | undefined): string | null {
  const number = whatsappNumber(phone)
  return number ? `https://wa.me/${number}` : null
}

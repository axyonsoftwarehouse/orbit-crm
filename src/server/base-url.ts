import { headers } from "next/headers"

/** URL pública do app para montar links de e-mail. */
export async function getBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "")
  if (configured) return configured
  const headerList = await headers()
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host")
  const proto = headerList.get("x-forwarded-proto") ?? "https"
  if (host) return `${proto}://${host}`
  return "http://localhost:3000"
}

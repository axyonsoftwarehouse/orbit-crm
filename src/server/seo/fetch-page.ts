import { lookup } from "node:dns/promises"
import { isIP } from "node:net"

const MAX_BYTES = 2_000_000
const MAX_REDIRECTS = 5
const TIMEOUT_MS = 8_000
const USER_AGENT = "OrbitCRM-SEO/0.1 (+https://orbitcrm.app)"

export class SeoFetchError extends Error {}

export type FetchedPage = {
  finalUrl: string
  status: number
  headers: Record<string, string>
  html: string
  responseTimeMs: number
  pageSizeBytes: number
  contentType: string
}

function isPrivateIpv4(address: string): boolean {
  const parts = address.split(".").map(Number)
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return true
  }

  const [a, b, c] = parts

  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0 && c === 0) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  )
}

function isPrivateIpv6(address: string): boolean {
  const normalized = address.toLowerCase()

  if (normalized === "::" || normalized === "::1") return true
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true
  if (
    normalized.startsWith("fe8") ||
    normalized.startsWith("fe9") ||
    normalized.startsWith("fea") ||
    normalized.startsWith("feb")
  ) {
    return true
  }

  if (normalized.startsWith("::ffff:")) {
    return isPrivateIpv4(normalized.slice("::ffff:".length))
  }

  return false
}

export function isPrivateAddress(address: string): boolean {
  const version = isIP(address)
  if (version === 4) return isPrivateIpv4(address)
  if (version === 6) return isPrivateIpv6(address)
  return true
}

async function assertPublicUrl(url: URL): Promise<void> {
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new SeoFetchError("Apenas URLs HTTP e HTTPS são permitidas.")
  }

  const host = url.hostname.toLowerCase()
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host === "metadata.google.internal"
  ) {
    throw new SeoFetchError("Este endereço não pode ser auditado.")
  }

  if (isIP(host)) {
    if (isPrivateAddress(host)) {
      throw new SeoFetchError("Este endereço não pode ser auditado.")
    }
    return
  }

  let addresses: { address: string }[]
  try {
    addresses = await lookup(host, { all: true, verbatim: true })
  } catch {
    throw new SeoFetchError("Não foi possível resolver o domínio.")
  }

  if (addresses.length === 0) {
    throw new SeoFetchError("Não foi possível resolver o domínio.")
  }

  if (addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new SeoFetchError("Este endereço não pode ser auditado.")
  }
}

export async function fetchHtml(rawUrl: string): Promise<FetchedPage> {
  const deadline = Date.now() + TIMEOUT_MS
  const startedAt = Date.now()
  let current: URL

  try {
    current = new URL(rawUrl)
  } catch {
    throw new SeoFetchError("URL inválida.")
  }

  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
    await assertPublicUrl(current)

    const remaining = deadline - Date.now()
    if (remaining <= 0) {
      throw new SeoFetchError("A página demorou demais para responder.")
    }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), remaining)

    let response: Response
    try {
      response = await fetch(current, {
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "user-agent": USER_AGENT,
          accept: "text/html,application/xhtml+xml",
          "accept-encoding": "gzip, deflate, br",
        },
      })
    } catch {
      clearTimeout(timer)
      throw new SeoFetchError("Não foi possível acessar a URL.")
    }

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      clearTimeout(timer)
      const location = response.headers.get("location")
      if (!location) throw new SeoFetchError("Redirecionamento sem destino.")
      current = new URL(location, current)
      continue
    }

    try {
      const contentType = response.headers.get("content-type") ?? ""
      if (!contentType.includes("text/html")) {
        throw new SeoFetchError("A URL não retornou uma página HTML.")
      }

      const contentLength = Number(response.headers.get("content-length") ?? 0)
      if (contentLength > MAX_BYTES) {
        throw new SeoFetchError("A página excede o limite de 2 MB.")
      }

      const html = await response.text()
      const pageSizeBytes = Buffer.byteLength(html, "utf8")
      if (pageSizeBytes > MAX_BYTES) {
        throw new SeoFetchError("A página excede o limite de 2 MB.")
      }

      const headers: Record<string, string> = {}
      response.headers.forEach((value, key) => {
        headers[key] = value
      })

      return {
        finalUrl: current.toString(),
        status: response.status,
        headers,
        html,
        responseTimeMs: Date.now() - startedAt,
        pageSizeBytes,
        contentType,
      }
    } catch (error) {
      if (error instanceof SeoFetchError) throw error
      throw new SeoFetchError("Não foi possível ler a página.")
    } finally {
      clearTimeout(timer)
    }
  }

  throw new SeoFetchError("Muitos redirecionamentos.")
}

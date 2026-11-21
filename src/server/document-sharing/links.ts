import { createHash, randomBytes } from "node:crypto"
import type { SupabaseClient } from "@supabase/supabase-js"
import { APP_TIME_ZONE } from "@/lib/format"
import type { DocumentKind } from "@/server/queries/documents"

const DAY_MS = 86_400_000
const ESTIMATE_DEFAULT_DAYS = 30
const INVOICE_DAYS = 90
const CONTRACT_DAYS = 30

/** Tipos de documento que aceitam link público. */
export type LinkKind = DocumentKind | "contract"

/** Token secreto do link (32 bytes, base64url) e o hash guardado no banco. */
export function generateLinkToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString("base64url")
  return { token, hash: hashLinkToken(token) }
}

export function hashLinkToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

/** Deslocamento (ms) do fuso em relação ao UTC numa data, ex.: -3h em SP. */
function timeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date)
  const get = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0)
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  )
  return asUtc - Math.floor(date.getTime() / 1000) * 1000
}

/**
 * Até quando o link vale: orçamento até o fim do dia da validade (no fuso do
 * app), ou 30 dias sem validade; fatura, 90 dias.
 */
export function linkExpiry(
  kind: LinkKind,
  expiryDate: string | null,
  now: Date = new Date(),
): string {
  if (kind === "estimate" && expiryDate) {
    const [year, month, day] = expiryDate.split("-").map(Number)
    const endUtcGuess = new Date(
      Date.UTC(year, month - 1, day, 23, 59, 59, 999),
    )
    const offset = timeZoneOffsetMs(endUtcGuess, APP_TIME_ZONE)
    return new Date(endUtcGuess.getTime() - offset).toISOString()
  }
  const days =
    kind === "estimate"
      ? ESTIMATE_DEFAULT_DAYS
      : kind === "contract"
        ? CONTRACT_DAYS
        : INVOICE_DAYS
  return new Date(now.getTime() + days * DAY_MS).toISOString()
}

/** Cria o link do documento e devolve o token (que só deve ir no e-mail). */
export async function createDocumentLink(
  supabase: SupabaseClient,
  input: {
    tenantId: string
    kind: LinkKind
    docId: string
    expiryDate: string | null
    userId: string | null
  },
): Promise<{ token: string; id: string } | { error: string }> {
  const { token, hash } = generateLinkToken()
  const { data, error } = await supabase
    .from("document_links")
    .insert({
      tenant_id: input.tenantId,
      rel_type: input.kind,
      rel_id: input.docId,
      token_hash: hash,
      expires_at: linkExpiry(input.kind, input.expiryDate),
      created_by: input.userId,
    })
    .select("id")
    .single()

  if (error || !data) return { error: "Não foi possível criar o link." }
  return { token, id: (data as { id: string }).id }
}

export type ResolvedLink = {
  id: string
  tenant_id: string
  rel_type: LinkKind
  rel_id: string
  expires_at: string
}

/** Link válido para o token, ou null se não existe, expirou ou foi revogado. */
export async function resolveDocumentLink(
  admin: SupabaseClient,
  token: string,
  now: Date = new Date(),
): Promise<ResolvedLink | null> {
  if (!token) return null
  const { data } = await admin
    .from("document_links")
    .select("id, tenant_id, rel_type, rel_id, expires_at, revoked_at")
    .eq("token_hash", hashLinkToken(token))
    .maybeSingle()

  const link = data as (ResolvedLink & { revoked_at: string | null }) | null
  if (!link || link.revoked_at) return null
  if (new Date(link.expires_at).getTime() <= now.getTime()) return null
  return {
    id: link.id,
    tenant_id: link.tenant_id,
    rel_type: link.rel_type,
    rel_id: link.rel_id,
    expires_at: link.expires_at,
  }
}

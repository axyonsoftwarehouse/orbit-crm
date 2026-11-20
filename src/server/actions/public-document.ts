"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { todayIso } from "@/lib/format"
import { resolveDocumentLink } from "@/server/document-sharing/links"
import { getClientIp, isRateLimited } from "@/server/rate-limit"

const INVALID = "Link inválido ou expirado."

/**
 * Resposta do cliente ao orçamento pelo link público (sem login). Fluxo
 * controlado com o client admin: o token é validado pelo hash, o orçamento é
 * lido pelo tenant e id do link, e o update só vale enquanto o orçamento está
 * Enviado (2), então um segundo clique não muda nada.
 */
export async function respondPublicEstimateAction(
  token: string,
  accept: boolean,
): Promise<{ status: number } | { error: string }> {
  const ip = await getClientIp()
  if (await isRateLimited(`doc:ip:${ip}`, 20, 600)) {
    return { error: "Muitas tentativas. Tente novamente em instantes." }
  }

  const admin = createAdminClient()
  const link = await resolveDocumentLink(admin, token)
  if (!link || link.rel_type !== "estimate") return { error: INVALID }

  const { data } = await admin
    .from("estimates")
    .select("id, status, expiry_date")
    .eq("id", link.rel_id)
    .eq("tenant_id", link.tenant_id)
    .is("deleted_at", null)
    .maybeSingle()
  const estimate = data as {
    id: string
    status: number
    expiry_date: string | null
  } | null
  if (!estimate) return { error: INVALID }
  if (estimate.status !== 2) return { status: estimate.status }
  if (estimate.expiry_date && estimate.expiry_date < todayIso()) {
    return { error: "Este orçamento venceu." }
  }

  const next = accept ? 4 : 3
  const { data: updated } = await admin
    .from("estimates")
    .update({ status: next })
    .eq("id", estimate.id)
    .eq("tenant_id", link.tenant_id)
    .eq("status", 2)
    .select("status")

  if (!updated?.length) {
    const { data: current } = await admin
      .from("estimates")
      .select("status")
      .eq("id", estimate.id)
      .eq("tenant_id", link.tenant_id)
      .maybeSingle()
    return { status: (current as { status: number } | null)?.status ?? 2 }
  }

  await admin
    .from("document_links")
    .update({ responded_at: new Date().toISOString() })
    .eq("id", link.id)

  return { status: next }
}

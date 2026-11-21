import { createAdminClient } from "@/lib/supabase/admin"
import { resolveDocumentLink } from "@/server/document-sharing/links"
import { loadContractView } from "@/server/document-sharing/contract-view"
import { contractPdfResponse } from "@/server/document-sharing/contract-pdf"
import { getClientIp, isRateLimited } from "@/server/rate-limit"

export const dynamic = "force-dynamic"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const ip = await getClientIp()
  if (await isRateLimited(`contract:view:${ip}`, 60, 600)) {
    return new Response("Muitas requisições. Tente novamente em instantes.", {
      status: 429,
    })
  }

  const { token } = await params
  const admin = createAdminClient()
  const link = await resolveDocumentLink(admin, token)
  if (!link || link.rel_type !== "contract") {
    return new Response("Link inválido ou expirado.", { status: 404 })
  }

  const view = await loadContractView(admin, link.tenant_id, link.rel_id)
  if (!view) return new Response("Link inválido ou expirado.", { status: 404 })

  return contractPdfResponse(view)
}

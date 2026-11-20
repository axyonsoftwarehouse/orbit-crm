import { createAdminClient } from "@/lib/supabase/admin"
import { resolveDocumentLink } from "@/server/document-sharing/links"
import { loadDocument } from "@/server/document-sharing/load"
import { pdfResponse } from "@/server/document-sharing/pdf"

export const dynamic = "force-dynamic"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  const admin = createAdminClient()
  const link = await resolveDocumentLink(admin, token)
  if (!link) return new Response("Link inválido ou expirado.", { status: 404 })

  const view = await loadDocument(
    admin,
    link.tenant_id,
    link.rel_type,
    link.rel_id,
  )
  if (!view) return new Response("Link inválido ou expirado.", { status: 404 })

  return pdfResponse(view)
}

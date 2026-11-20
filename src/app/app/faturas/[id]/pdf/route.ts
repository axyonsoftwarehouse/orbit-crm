import { createClient } from "@/lib/supabase/server"
import { getActiveMembership } from "@/lib/tenant"
import { loadDocument } from "@/server/document-sharing/load"
import { pdfResponse } from "@/server/document-sharing/pdf"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const active = await getActiveMembership()
  if (!active) return new Response("Não autorizado", { status: 401 })

  const { id } = await params
  const supabase = await createClient()
  const view = await loadDocument(supabase, active.tenantId, "invoice", id)
  if (!view) return new Response("Documento não encontrado", { status: 404 })

  return pdfResponse(view)
}

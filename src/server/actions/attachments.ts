"use server"

import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth"
import { getActiveMembership } from "@/lib/tenant"
import { revalidateEntity } from "@/lib/revalidate"

const ENTITY_TYPES = ["task", "project", "ticket"]

export type RegisterAttachmentInput = {
  entityType: string
  entityId: string
  storagePath: string
  fileName: string
  mimeType: string | null
  sizeBytes: number
}

export async function registerAttachmentAction(
  input: RegisterAttachmentInput,
): Promise<{ error?: string }> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }

  if (!ENTITY_TYPES.includes(input.entityType)) {
    return { error: "Entidade inválida." }
  }
  if (!input.storagePath.startsWith(`${active.tenantId}/`)) {
    return { error: "Caminho de arquivo inválido." }
  }

  const user = await getUser()
  const supabase = await createClient()
  const { error } = await supabase.from("attachments").insert({
    tenant_id: active.tenantId,
    entity_type: input.entityType,
    entity_id: input.entityId,
    storage_path: input.storagePath,
    file_name: input.fileName,
    mime_type: input.mimeType,
    size_bytes: input.sizeBytes,
    uploaded_by: user?.id ?? null,
  })

  if (error) return { error: error.message }

  revalidateEntity(input.entityType, input.entityId)
  return {}
}

export async function deleteAttachmentAction(formData: FormData) {
  const active = await getActiveMembership()
  if (!active) return

  const id = String(formData.get("id") ?? "")
  const path = String(formData.get("storage_path") ?? "")
  const entityType = String(formData.get("entity_type") ?? "")
  const entityId = String(formData.get("entity_id") ?? "")
  if (!id) return

  const supabase = await createClient()
  if (path) {
    await supabase.storage.from("attachments").remove([path])
  }
  await supabase
    .from("attachments")
    .delete()
    .eq("id", id)
    .eq("tenant_id", active.tenantId)

  revalidateEntity(entityType, entityId)
}

"use server"

import { createClient } from "@/lib/supabase/server"
import { getActiveMembership } from "@/lib/tenant"
import { logger } from "@/lib/logger"
import { checkStorageLimit } from "@/server/plan-limits"
import {
  attachmentEntityTable,
  SOCIAL_IMAGE_MAX_BYTES,
  storageObjectPath,
} from "@/lib/storage-paths"

export type UploadUrlInput = (
  | { kind: "attachment"; entityType: string; entityId: string }
  | { kind: "social_media"; postId: string }
) & { fileName: string; mimeType: string; sizeBytes: number }

export type UploadUrlResult =
  { error: string } | { bucket: string; path: string; token: string }

/**
 * Prepara o upload de um arquivo: valida empresa, entidade e cota, monta o
 * caminho no servidor e devolve uma URL assinada de uso único. O navegador
 * sobe o arquivo com `uploadToSignedUrl`, sem precisar da sessão (os cookies
 * de sessão são httpOnly e o cliente Supabase do navegador é anônimo).
 */
export async function createUploadUrlAction(
  input: UploadUrlInput,
): Promise<UploadUrlResult> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }
  if (!Number.isFinite(input.sizeBytes) || input.sizeBytes < 0) {
    return { error: "Arquivo inválido." }
  }

  const supabase = await createClient()
  let bucket: string
  let folder: string

  if (input.kind === "attachment") {
    const table = attachmentEntityTable(input.entityType)
    if (!table) return { error: "Entidade inválida." }
    const { data: entity } = await supabase
      .from(table)
      .select("id")
      .eq("id", input.entityId)
      .eq("tenant_id", active.tenantId)
      .is("deleted_at", null)
      .maybeSingle()
    if (!entity) return { error: "Registro não encontrado." }
    bucket = "attachments"
    folder = `${input.entityType}/${input.entityId}`
  } else {
    if (!input.mimeType.startsWith("image/")) {
      return { error: "Envie apenas imagens." }
    }
    if (input.sizeBytes > SOCIAL_IMAGE_MAX_BYTES) {
      return { error: "A imagem deve ter no máximo 10 MB." }
    }
    const { data: post } = await supabase
      .from("social_posts")
      .select("id")
      .eq("id", input.postId)
      .eq("tenant_id", active.tenantId)
      .is("deleted_at", null)
      .maybeSingle()
    if (!post) return { error: "Post inválido." }
    bucket = "social_media"
    folder = `social/${input.postId}`
  }

  const limit = await checkStorageLimit(active.tenantId, input.sizeBytes)
  if (!limit.ok) return { error: limit.message ?? "Limite do plano atingido." }

  const path = storageObjectPath(active.tenantId, folder, input.fileName)
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUploadUrl(path)

  if (error || !data) {
    logger.error("storage.signed_upload_failed", {
      bucket,
      error: error?.message ?? "sem token",
    })
    return { error: "Não foi possível preparar o envio. Tente novamente." }
  }

  return { bucket, path, token: data.token }
}

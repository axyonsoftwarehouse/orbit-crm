"use client"

import { createClient } from "@/lib/supabase/client"
import {
  createUploadUrlAction,
  type UploadUrlInput,
} from "@/server/actions/storage"

type UploadTarget =
  | { kind: "attachment"; entityType: string; entityId: string }
  | { kind: "social_media"; postId: string }

/**
 * Envia um arquivo ao Storage por URL assinada: o servidor valida e devolve o
 * caminho e o token, e o navegador sobe o arquivo sem precisar da sessão.
 * Devolve o caminho para o registro, ou lança um erro com mensagem amigável.
 */
export async function uploadWithSignedUrl(
  target: UploadTarget,
  file: File,
): Promise<string> {
  const mimeType = file.type || "application/octet-stream"
  const prepared = await createUploadUrlAction({
    ...target,
    fileName: file.name,
    mimeType,
    sizeBytes: file.size,
  } as UploadUrlInput)
  if ("error" in prepared) throw new Error(prepared.error)

  const supabase = createClient()
  const { error } = await supabase.storage
    .from(prepared.bucket)
    .uploadToSignedUrl(prepared.path, prepared.token, file, {
      contentType: mimeType,
    })
  if (error) {
    console.error("upload_failed", error)
    throw new Error("Não foi possível enviar o arquivo. Tente novamente.")
  }

  return prepared.path
}

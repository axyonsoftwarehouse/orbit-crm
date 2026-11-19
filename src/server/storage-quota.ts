import type { SupabaseClient } from "@supabase/supabase-js"
import { logger } from "@/lib/logger"
import { checkStorageLimit } from "@/server/plan-limits"

/**
 * Confere um arquivo já enviado ao Storage antes de registrá-lo: lê o tamanho
 * real do objeto (o informado pelo navegador não é confiável) e aplica a cota
 * `storage_mb` do plano. Se estourar, remove o objeto para não deixar arquivo
 * órfão ocupando espaço.
 */
export async function verifyUploadedFile(
  supabase: SupabaseClient,
  params: { bucket: string; path: string; tenantId: string },
): Promise<{ size: number } | { error: string }> {
  const bucket = supabase.storage.from(params.bucket)
  const { data, error } = await bucket.info(params.path)
  if (error || !data || typeof data.size !== "number") {
    logger.error("storage.info_failed", {
      bucket: params.bucket,
      error: error?.message ?? "sem tamanho",
    })
    return { error: "Não foi possível conferir o arquivo enviado." }
  }

  const limit = await checkStorageLimit(params.tenantId, data.size)
  if (!limit.ok) {
    await bucket.remove([params.path])
    return { error: limit.message ?? "Limite de armazenamento atingido." }
  }

  return { size: data.size }
}

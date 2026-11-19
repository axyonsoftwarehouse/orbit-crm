import type { SupabaseClient } from "@supabase/supabase-js"
import { logger } from "@/lib/logger"
import { checkStorageLimit } from "@/server/plan-limits"

/**
 * Confere um arquivo já enviado ao Storage antes de registrá-lo: lê o tamanho
 * real do objeto (o informado pelo navegador não é confiável) e aplica a cota
 * `storage_mb` do plano. Se estourar, remove o objeto para não deixar arquivo
 * órfão ocupando espaço.
 *
 * Um caminho que já tem linha registrada é recusado antes de tudo: sem isso,
 * reenviar o caminho de um arquivo existente com a cota estourada apagaria o
 * arquivo de verdade e deixaria o registro apontando para o nada.
 */
export async function verifyUploadedFile(
  supabase: SupabaseClient,
  params: {
    bucket: string
    table: "attachments" | "social_media"
    path: string
    tenantId: string
  },
): Promise<{ size: number } | { error: string }> {
  const { data: existing } = await supabase
    .from(params.table)
    .select("id")
    .eq("tenant_id", params.tenantId)
    .eq("storage_path", params.path)
    .maybeSingle()
  if (existing) return { error: "Este arquivo já foi registrado." }

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

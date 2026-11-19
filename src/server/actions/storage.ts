"use server"

import { getActiveMembership } from "@/lib/tenant"
import { checkStorageLimit } from "@/server/plan-limits"

/**
 * Checagem antes do upload: o arquivo vai do navegador direto para o Storage,
 * então o uploader pergunta se cabe na cota antes de enviar. O registro do
 * arquivo checa de novo com o tamanho real.
 */
export async function checkStorageQuotaAction(
  sizeBytes: number,
): Promise<{ error?: string }> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }
  if (!Number.isFinite(sizeBytes) || sizeBytes < 0) {
    return { error: "Arquivo inválido." }
  }

  const limit = await checkStorageLimit(active.tenantId, sizeBytes)
  if (!limit.ok) return { error: limit.message ?? "Limite do plano atingido." }
  return {}
}

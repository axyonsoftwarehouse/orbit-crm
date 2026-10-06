import { logger } from "@/lib/logger"

/**
 * Registra o erro do banco no servidor e devolve uma mensagem genérica ao
 * cliente, evitando vazar detalhes de schema/constraint.
 */
export function dbError(
  context: string,
  error: { message?: string } | null | undefined,
  message = "Não foi possível concluir a operação. Tente novamente.",
): { error: string } {
  logger.error(`db.${context}`, { error: error?.message ?? "unknown" })
  return { error: message }
}

/**
 * Regras de edição de posts do Social.
 *
 * - Rascunho e rejeitado: edita livremente (o rejeitado continua rejeitado,
 *   com o comentário visível, até ser reenviado para aprovação).
 * - Aprovado e agendado: edita; se o post exige aprovação, a edição desfaz a
 *   aprovação e o agendamento e o post volta para rascunho (FR-04).
 * - Aguardando aprovação, publicando, publicado, falhou e cancelado: não edita.
 *
 * As mesmas regras valem para adicionar ou remover mídia.
 */
export const SOCIAL_EDITABLE_STATUSES = [
  "draft",
  "rejected",
  "approved",
  "scheduled",
] as const

const APPROVED_STATUSES = ["approved", "scheduled"]

/** Providers que publicam sozinhos quando a publicação nativa está ligada. */
const NATIVE_PROVIDERS = ["instagram", "linkedin"]

export function isSocialPostEditable(status: string): boolean {
  return (SOCIAL_EDITABLE_STATUSES as readonly string[]).includes(status)
}

/** A edição desfaz a aprovação (e o agendamento) deste post? */
export function editResetsApproval(
  status: string,
  requiresApproval: boolean,
): boolean {
  return requiresApproval && APPROVED_STATUSES.includes(status)
}

/** Valores gravados no post quando a edição desfaz a aprovação. */
export const APPROVAL_RESET_VALUES = {
  status: "draft",
  scheduled_at: null,
  approved_by: null,
  approved_at: null,
} as const

/**
 * Texto sobre como o post vai ao ar, conforme os destinos: redes conectadas
 * (com publicação nativa ligada) publicam sozinhas; as demais são publicadas
 * pela agência.
 */
export function publishModeNotice(
  providers: string[],
  nativeEnabled: boolean,
): string | null {
  if (providers.length === 0) return null
  const native = nativeEnabled
    ? providers.filter((provider) => NATIVE_PROVIDERS.includes(provider))
    : []
  if (native.length === providers.length) {
    return "As contas conectadas publicam automaticamente no horário agendado."
  }
  if (native.length === 0) {
    return "A publicação é feita pela agência: no horário agendado, copie o texto e publique em cada rede, depois marque como publicado."
  }
  return "Instagram e LinkedIn conectados publicam automaticamente no horário agendado; nas demais redes, a agência publica e marca como publicado."
}

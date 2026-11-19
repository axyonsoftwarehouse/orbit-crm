/**
 * Decide se um post do Social nasce exigindo aprovação do cliente.
 * Com `social_settings.approval_required` ligado, a escolha do formulário é
 * ignorada; desligado, vale o que foi pedido no post.
 */
export function resolveRequiresApproval(
  settingRequired: boolean,
  requested: boolean,
): boolean {
  return settingRequired || requested
}

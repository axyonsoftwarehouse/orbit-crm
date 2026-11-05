/**
 * Regra de destino de um post do Social: uma conta só pode receber posts do
 * cliente a que pertence. Contas sem cliente (`company_id` nulo) são da
 * agência e servem a qualquer cliente. O banco aplica a mesma regra no trigger
 * `social_post_targets_check_company` (migration 0053).
 */
export function isAccountAllowedForCompany(
  account: { company_id: string | null },
  companyId: string,
): boolean {
  return account.company_id === null || account.company_id === companyId
}

export type PostTargetsCheck =
  { ok: true } | { ok: false; reason: "not_found" | "other_company" }

export function validatePostTargets(
  targetIds: string[],
  accounts: { id: string; company_id: string | null }[],
  companyId: string,
): PostTargetsCheck {
  const byId = new Map(accounts.map((account) => [account.id, account]))
  for (const id of new Set(targetIds)) {
    const account = byId.get(id)
    if (!account) return { ok: false, reason: "not_found" }
    if (!isAccountAllowedForCompany(account, companyId)) {
      return { ok: false, reason: "other_company" }
    }
  }
  return { ok: true }
}

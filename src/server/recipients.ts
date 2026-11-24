import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * Quem recebe um aviso interno sobre um registro: a pessoa preferida (autor,
 * responsável), se ainda for membro ativo do tenant; senão (ou sem ninguém
 * preferido), os owner/admin ativos. Quem saiu do tenant não deve receber
 * trechos do registro nem mensagens do cliente.
 */
export async function resolveStaffRecipients(
  admin: SupabaseClient,
  tenantId: string,
  preferredUserId: string | null,
): Promise<string[]> {
  if (preferredUserId) {
    const { data: membership } = await admin
      .from("memberships")
      .select("user_id")
      .eq("tenant_id", tenantId)
      .eq("user_id", preferredUserId)
      .eq("status", "active")
      .maybeSingle()
    if (membership) return [preferredUserId]
  }

  const { data: admins } = await admin
    .from("memberships")
    .select("user_id")
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .in("role", ["owner", "admin"])

  return ((admins ?? []) as { user_id: string }[]).map((row) => row.user_id)
}

/** E-mails válidos sem repetição (ignora maiúsculas e espaços). */
export function uniqueEmails(list: (string | null | undefined)[]): string[] {
  const seen = new Set<string>()
  for (const value of list) {
    const email = value?.trim().toLowerCase()
    if (email) seen.add(email)
  }
  return [...seen]
}

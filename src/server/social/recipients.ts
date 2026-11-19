import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * Quem recebe um aviso interno sobre um post do Social: o autor, se ainda for
 * membro ativo do tenant; senão (ou sem autor), os owner/admin ativos. Quem
 * saiu do tenant não deve receber trecho do post nem nota do cliente.
 */
export async function resolveSocialRecipients(
  admin: SupabaseClient,
  tenantId: string,
  createdBy: string | null,
): Promise<string[]> {
  if (createdBy) {
    const { data: membership } = await admin
      .from("memberships")
      .select("user_id")
      .eq("tenant_id", tenantId)
      .eq("user_id", createdBy)
      .eq("status", "active")
      .maybeSingle()
    if (membership) return [createdBy]
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

import type { SupabaseClient } from "@supabase/supabase-js"

export type PortalInvitation = {
  id: string
  tenant_id: string
  contact_id: string
  email: string
  tenantName: string
  contactName: string
}

export type PortalInvitationLookup =
  { ok: true; invitation: PortalInvitation } | { ok: false; message: string }

type Row = {
  id: string
  tenant_id: string
  contact_id: string
  email: string
  accepted_at: string | null
  expires_at: string
  tenant: { name: string } | null
  contact: {
    first_name: string
    email: string | null
    user_id: string | null
    deleted_at: string | null
  } | null
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Valida um convite do portal pelo token (client admin: quem abre o link
 * ainda não tem sessão). O convite só vale se não foi usado, não expirou, o
 * contato ainda existe, não tem acesso e continua com o mesmo e-mail.
 */
export async function lookupPortalInvitation(
  admin: SupabaseClient,
  token: string,
): Promise<PortalInvitationLookup> {
  const invalid = { ok: false as const, message: "Convite inválido." }
  if (!UUID.test(token)) return invalid

  const { data } = await admin
    .from("portal_invitations")
    .select(
      "id, tenant_id, contact_id, email, accepted_at, expires_at, tenant:tenants(name), contact:contacts(first_name, email, user_id, deleted_at)",
    )
    .eq("token", token)
    .maybeSingle()
  const row = data as unknown as Row | null

  if (!row || !row.contact || row.contact.deleted_at) return invalid
  if (row.accepted_at) {
    return { ok: false, message: "Este convite já foi utilizado." }
  }
  if (new Date(row.expires_at) < new Date()) {
    return {
      ok: false,
      message: "Este convite expirou. Peça um novo à agência.",
    }
  }
  if (row.contact.user_id) {
    return { ok: false, message: "Este contato já possui acesso ao portal." }
  }
  if (row.contact.email?.trim().toLowerCase() !== row.email.toLowerCase()) {
    return invalid
  }

  return {
    ok: true,
    invitation: {
      id: row.id,
      tenant_id: row.tenant_id,
      contact_id: row.contact_id,
      email: row.email,
      tenantName: row.tenant?.name ?? "a agência",
      contactName: row.contact.first_name,
    },
  }
}

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export type TeamMember = {
  user_id: string
  role: string
  full_name: string | null
  email: string | null
}

export type TeamInvitation = {
  id: string
  email: string
  role: string
  expires_at: string
  created_at: string
}

export async function listTeamMembers(tenantId: string): Promise<TeamMember[]> {
  const supabase = await createClient()
  const { data: memberships } = await supabase
    .from("memberships")
    .select("user_id, role, profile:profiles(full_name)")
    .eq("tenant_id", tenantId)
    .eq("status", "active")

  const rows = (memberships ?? []) as unknown as {
    user_id: string
    role: string
    profile: { full_name: string | null } | null
  }[]

  const emailById = new Map<string, string | null>()
  try {
    const admin = createAdminClient()
    const { data } = await admin.auth.admin.listUsers({ perPage: 200 })
    for (const user of data?.users ?? []) {
      emailById.set(user.id, user.email ?? null)
    }
  } catch {
    // sem service role não exibimos e-mails
  }

  const order: Record<string, number> = { owner: 0, admin: 1, member: 2 }

  return rows
    .map((row) => ({
      user_id: row.user_id,
      role: row.role,
      full_name: row.profile?.full_name ?? null,
      email: emailById.get(row.user_id) ?? null,
    }))
    .sort((a, b) => (order[a.role] ?? 9) - (order[b.role] ?? 9))
}

export async function listPendingInvitations(
  tenantId: string,
): Promise<TeamInvitation[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("invitations")
    .select("id, email, role, expires_at, created_at")
    .eq("tenant_id", tenantId)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })

  return (data ?? []) as TeamInvitation[]
}

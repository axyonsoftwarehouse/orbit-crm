import { cache } from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import type { Role } from "@/lib/constants"

export type MembershipTenant = {
  id: string
  name: string
  slug: string
  primaryColor: string | null
  logoUrl: string | null
  webToLeadEnabled: boolean
  webToLeadSourceId: string | null
}

export type Membership = {
  tenantId: string
  role: Role
  tenant: MembershipTenant
}

export type Profile = {
  id: string
  full_name: string | null
  avatar_url: string | null
  is_super_admin: boolean
  notify_email: boolean
}

type RawMembership = {
  role: Role
  tenant: {
    id: string
    name: string
    slug: string
    primary_color: string | null
    logo_url: string | null
    web_to_lead_enabled: boolean
    web_to_lead_source_id: string | null
  } | null
}

export const getUser = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
})

export async function requireUser() {
  const user = await getUser()
  if (!user) redirect("/login")
  return user
}

export const getProfile = cache(async (): Promise<Profile | null> => {
  const user = await getUser()
  if (!user) return null

  const supabase = await createClient()
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, is_super_admin, notify_email")
    .eq("id", user.id)
    .single()

  return (data as Profile | null) ?? null
})

export const getMemberships = cache(async (): Promise<Membership[]> => {
  const user = await getUser()
  if (!user) return []

  const supabase = await createClient()
  const { data } = await supabase
    .from("memberships")
    .select(
      "role, tenant:tenants(id, name, slug, primary_color, logo_url, web_to_lead_enabled, web_to_lead_source_id)",
    )
    .eq("user_id", user.id)
    .eq("status", "active")

  const rows = (data ?? []) as unknown as RawMembership[]

  return rows
    .filter((row) => row.tenant)
    .map((row) => ({
      role: row.role,
      tenantId: row.tenant!.id,
      tenant: {
        id: row.tenant!.id,
        name: row.tenant!.name,
        slug: row.tenant!.slug,
        primaryColor: row.tenant!.primary_color,
        logoUrl: row.tenant!.logo_url,
        webToLeadEnabled: row.tenant!.web_to_lead_enabled,
        webToLeadSourceId: row.tenant!.web_to_lead_source_id,
      },
    }))
})

export async function requireSuperAdmin() {
  const user = await requireUser()
  const profile = await getProfile()
  if (!profile?.is_super_admin) redirect("/app")
  return { user, profile }
}

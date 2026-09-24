import { cookies, headers } from "next/headers"
import { TENANT_COOKIE } from "@/lib/constants"
import { getMemberships, type Membership } from "@/lib/auth"

export async function getActiveTenant(
  memberships: Membership[],
): Promise<Membership | null> {
  if (memberships.length === 0) return null

  // Subdomínio (quando configurado) tem prioridade.
  const headerList = await headers()
  const hostSlug = headerList.get("x-tenant-slug")
  if (hostSlug) {
    const bySlug = memberships.find(
      (membership) => membership.tenant.slug === hostSlug,
    )
    if (bySlug) return bySlug
  }

  const store = await cookies()
  const activeId = store.get(TENANT_COOKIE)?.value

  return (
    memberships.find((membership) => membership.tenant.id === activeId) ??
    memberships[0]
  )
}

export async function getActiveMembership(): Promise<Membership | null> {
  const memberships = await getMemberships()
  return getActiveTenant(memberships)
}

"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { TENANT_COOKIE } from "@/lib/constants"
import { getMemberships } from "@/lib/auth"

export async function setActiveTenantAction(tenantId: string) {
  const memberships = await getMemberships()
  const allowed = memberships.some(
    (membership) => membership.tenant.id === tenantId,
  )

  if (!allowed) {
    throw new Error("Você não tem acesso a esta empresa.")
  }

  const store = await cookies()
  store.set(TENANT_COOKIE, tenantId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  })

  redirect("/app")
}

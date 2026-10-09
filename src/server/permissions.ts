import type { Role } from "@/lib/constants"

export const MANAGER_ROLES: Role[] = ["owner", "admin"]

export function isManager(role: Role): boolean {
  return role === "owner" || role === "admin"
}

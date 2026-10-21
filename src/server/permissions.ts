import type { Role } from "@/lib/constants"

export function isManager(role: Role): boolean {
  return role === "owner" || role === "admin"
}

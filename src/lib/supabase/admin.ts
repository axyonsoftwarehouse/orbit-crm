import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/database.types"
import { env } from "@/lib/env"

/**
 * Cliente com service role: IGNORA RLS. Use apenas no servidor, em fluxos
 * administrativos controlados (criação de tenants/convites, jobs).
 */
export function createAdminClient() {
  const {
    NEXT_PUBLIC_SUPABASE_URL: url,
    SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey,
  } = env()

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY/NEXT_PUBLIC_SUPABASE_URL não configurados.",
    )
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

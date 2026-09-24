import { createClient } from "@supabase/supabase-js"

/**
 * Cliente com service role: IGNORA RLS. Use apenas no servidor, em fluxos
 * administrativos controlados (criação de tenants/convites, jobs).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY/NEXT_PUBLIC_SUPABASE_URL não configurados.",
    )
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

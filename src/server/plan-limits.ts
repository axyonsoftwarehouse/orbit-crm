import type { SupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"

type ResourceTable = "companies" | "projects" | "tasks" | "tickets" | "leads"

const RESOURCE_TABLES: Record<string, ResourceTable> = {
  clients: "companies",
  projects: "projects",
  tasks: "tasks",
  tickets: "tickets",
  leads: "leads",
}

export type PlanLimitResult = {
  ok: boolean
  message?: string
  remaining?: number
}

/**
 * Mesma verificação de `checkPlanLimit`, mas recebendo o cliente Supabase.
 * Necessário em fluxos sem usuário autenticado (ex.: formulário público) e em
 * fluxos do portal, onde o cliente não enxerga `plans`.
 */
export async function checkPlanLimitWith(
  supabase: SupabaseClient,
  tenantId: string,
  resource: string,
): Promise<PlanLimitResult> {
  const table = RESOURCE_TABLES[resource]
  if (!table) return { ok: true }

  const { data: tenant } = await supabase
    .from("tenants")
    .select("plan:plans(limits)")
    .eq("id", tenantId)
    .maybeSingle()

  const limits =
    (
      tenant as {
        plan: { limits: Record<string, number | null> } | null
      } | null
    )?.plan?.limits ?? {}

  const limit = limits[resource]
  if (limit === null || limit === undefined) return { ok: true }

  const { count } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)

  const used = count ?? 0
  const remaining = Math.max(0, limit - used)

  if (used >= limit) {
    return {
      ok: false,
      remaining: 0,
      message:
        "Limite do plano atingido para este recurso. Faça upgrade para continuar.",
    }
  }
  return { ok: true, remaining }
}

export async function checkPlanLimit(
  tenantId: string,
  resource: string,
): Promise<PlanLimitResult> {
  const supabase = await createClient()
  return checkPlanLimitWith(supabase, tenantId, resource)
}

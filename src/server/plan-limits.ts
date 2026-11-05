import type { SupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"

type ResourceTable =
  | "companies"
  | "projects"
  | "tasks"
  | "tickets"
  | "leads"
  | "seo_sites"
  | "social_accounts"
  | "social_posts"

/**
 * Como cada chave de `plans.limits` é contada:
 * - `active`: linhas não excluídas (`deleted_at is null`) do tenant;
 * - `month`: linhas criadas desde o início do mês (UTC), inclusive as
 *   excluídas, para que excluir não devolva a cota do mês.
 */
const RESOURCES: Record<
  string,
  { table: ResourceTable; scope: "active" | "month" }
> = {
  clients: { table: "companies", scope: "active" },
  projects: { table: "projects", scope: "active" },
  tasks: { table: "tasks", scope: "active" },
  tickets: { table: "tickets", scope: "active" },
  leads: { table: "leads", scope: "active" },
  seo_sites: { table: "seo_sites", scope: "active" },
  social_accounts: { table: "social_accounts", scope: "active" },
  social_posts_month: { table: "social_posts", scope: "month" },
}

export type PlanLimitResult = {
  ok: boolean
  message?: string
  remaining?: number
}

export function startOfMonthUtc(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
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
  now: Date = new Date(),
): Promise<PlanLimitResult> {
  const config = RESOURCES[resource]
  if (!config) return { ok: true }

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

  let query = supabase
    .from(config.table)
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
  query =
    config.scope === "month"
      ? query.gte("created_at", startOfMonthUtc(now).toISOString())
      : query.is("deleted_at", null)

  const { count } = await query

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

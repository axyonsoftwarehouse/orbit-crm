import { createClient } from "@/lib/supabase/server"

type ResourceTable = "companies" | "projects" | "tasks" | "tickets" | "leads"

const RESOURCE_TABLES: Record<string, ResourceTable> = {
  clients: "companies",
  projects: "projects",
  tasks: "tasks",
  tickets: "tickets",
  leads: "leads",
}

export async function checkPlanLimit(
  tenantId: string,
  resource: string,
): Promise<{ ok: boolean; message?: string }> {
  const table = RESOURCE_TABLES[resource]
  if (!table) return { ok: true }

  const supabase = await createClient()
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

  if ((count ?? 0) >= limit) {
    return {
      ok: false,
      message:
        "Limite do plano atingido para este recurso. Faça upgrade para continuar.",
    }
  }
  return { ok: true }
}

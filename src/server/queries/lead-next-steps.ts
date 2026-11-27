import type { SupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"

export type OpenNextStep = {
  id: string
  lead_id: string
  lead_name: string
  type: string
  next_step_at: string
  next_step_note: string | null
  /** Quem recebe o lembrete: responsável pelo lead ou, sem ele, o autor. */
  owner_id: string | null
}

type Row = {
  id: string
  lead_id: string
  type: string
  author_id: string | null
  next_step_at: string
  next_step_note: string | null
  lead: {
    name: string
    assignee_id: string | null
    deleted_at: string | null
  } | null
}

export const OPEN_NEXT_STEP_SELECT =
  "id, lead_id, type, author_id, next_step_at, next_step_note, lead:leads!lead_activities_lead_fk(name, assignee_id, deleted_at)"

/** Converte as linhas e descarta as de leads excluídos. */
export function toOpenNextSteps(rows: unknown): OpenNextStep[] {
  return ((rows ?? []) as Row[])
    .filter((row) => row.lead && row.lead.deleted_at === null)
    .map((row) => ({
      id: row.id,
      lead_id: row.lead_id,
      lead_name: row.lead!.name,
      type: row.type,
      next_step_at: row.next_step_at,
      next_step_note: row.next_step_note,
      owner_id: row.lead!.assignee_id ?? row.author_id,
    }))
}

/** Próximos passos em aberto até `untilIso` (e a partir de `fromIso`). */
export async function listOpenNextSteps(
  tenantId: string,
  options: { fromIso?: string; untilIso: string; client?: SupabaseClient },
): Promise<OpenNextStep[]> {
  const supabase = options.client ?? (await createClient())
  let query = supabase
    .from("lead_activities")
    .select(OPEN_NEXT_STEP_SELECT)
    .eq("tenant_id", tenantId)
    .not("next_step_at", "is", null)
    .is("next_step_done_at", null)
    .lt("next_step_at", options.untilIso)
  if (options.fromIso) query = query.gte("next_step_at", options.fromIso)
  const { data } = await query.order("next_step_at").limit(200)
  return toOpenNextSteps(data)
}

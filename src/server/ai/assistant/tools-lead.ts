import { tool } from "ai"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/database.types"
import { draftEmailTool, failTool as fail, noInput, ROW_LIMIT } from "./common"

type Ctx = {
  supabase: SupabaseClient<Database>
  tenantId: string
  leadId: string
}

export function buildLeadTools({ supabase, tenantId, leadId }: Ctx) {
  return {
    getLeadOverview: tool({
      description:
        "Dados do lead (contato, empresa, valor, status, origem, se foi convertido ou perdido).",
      inputSchema: noInput,
      execute: async () => {
        const { data, error } = await supabase
          .from("leads")
          .select(
            "name, title, company, email, phone, website, city, state, value, description, lost, converted_at, created_at, status:lead_statuses(name), source:lead_sources(name)",
          )
          .eq("id", leadId)
          .eq("tenant_id", tenantId)
          .is("deleted_at", null)
          .maybeSingle()
        if (error) return fail("getLeadOverview", error)
        if (!data) return { lead: null }
        const { status, source, ...lead } = data
        return {
          lead: {
            ...lead,
            status: (status as { name: string } | null)?.name ?? null,
            source: (source as { name: string } | null)?.name ?? null,
          },
        }
      },
    }),

    listActivities: tool({
      description:
        "Histórico de atividades do lead (anotações e mudanças), da mais recente para a mais antiga.",
      inputSchema: noInput,
      execute: async () => {
        const { data, error } = await supabase
          .from("lead_activities")
          .select("description, created_at, author:profiles(full_name)")
          .eq("tenant_id", tenantId)
          .eq("lead_id", leadId)
          .order("created_at", { ascending: false })
          .limit(ROW_LIMIT)
        if (error) return fail("listActivities", error)
        return {
          activities: (data ?? []).map((a) => ({
            description: a.description,
            created_at: a.created_at,
            author:
              (a.author as { full_name: string | null } | null)?.full_name ??
              null,
          })),
        }
      },
    }),

    draftEmail: draftEmailTool(),
  }
}

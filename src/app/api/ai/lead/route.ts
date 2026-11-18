import { getLead } from "@/server/queries/leads"
import { handleAssistantRequest } from "@/server/ai/assistant/handler"
import { buildLeadSystemPrompt } from "@/server/ai/assistant/prompt"
import { buildLeadTools } from "@/server/ai/assistant/tools-lead"

export const maxDuration = 30

export async function POST(request: Request): Promise<Response> {
  return handleAssistantRequest(request, {
    idField: "leadId",
    notFound: "Lead não encontrado.",
    resolve: async ({ supabase, tenantId, entityId, userName, today }) => {
      const lead = await getLead(tenantId, entityId)
      if (!lead) return null
      return {
        system: buildLeadSystemPrompt({ leadName: lead.name, userName, today }),
        tools: buildLeadTools({ supabase, tenantId, leadId: lead.id }),
      }
    },
  })
}

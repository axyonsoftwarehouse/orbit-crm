import { getCompany } from "@/server/queries/companies"
import { handleAssistantRequest } from "@/server/ai/assistant/handler"
import { buildAssistantSystemPrompt } from "@/server/ai/assistant/prompt"
import { buildAssistantTools } from "@/server/ai/assistant/tools"

export const maxDuration = 30

export async function POST(request: Request): Promise<Response> {
  return handleAssistantRequest(request, {
    idField: "companyId",
    notFound: "Cliente não encontrado.",
    resolve: async ({ supabase, tenantId, entityId, userName, today }) => {
      const company = await getCompany(tenantId, entityId)
      if (!company) return null
      return {
        system: buildAssistantSystemPrompt({
          companyName: company.name,
          userName,
          today,
        }),
        tools: buildAssistantTools({ supabase, tenantId, companyId: entityId }),
      }
    },
  })
}

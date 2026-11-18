import { getCompany } from "@/server/queries/companies"
import { getProject } from "@/server/queries/projects"
import { handleAssistantRequest } from "@/server/ai/assistant/handler"
import { buildProjectSystemPrompt } from "@/server/ai/assistant/prompt"
import { buildProjectTools } from "@/server/ai/assistant/tools-project"

export const maxDuration = 30

export async function POST(request: Request): Promise<Response> {
  return handleAssistantRequest(request, {
    idField: "projectId",
    notFound: "Projeto não encontrado.",
    resolve: async ({ supabase, tenantId, entityId, userName, today }) => {
      const project = await getProject(tenantId, entityId)
      if (!project) return null
      const company = project.company_id
        ? await getCompany(tenantId, project.company_id)
        : null
      const companyId = company?.id ?? null
      return {
        system: buildProjectSystemPrompt({
          projectId: project.id,
          projectName: project.name,
          companyName: company?.name ?? null,
          canProposeTasks: Boolean(companyId),
          userName,
          today,
        }),
        tools: buildProjectTools({
          supabase,
          tenantId,
          projectId: project.id,
          companyId,
        }),
      }
    },
  })
}

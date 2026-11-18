import { getTicket } from "@/server/queries/tickets"
import { handleAssistantRequest } from "@/server/ai/assistant/handler"
import { buildTicketSystemPrompt } from "@/server/ai/assistant/prompt"
import { buildTicketTools } from "@/server/ai/assistant/tools-ticket"

export const maxDuration = 30

export async function POST(request: Request): Promise<Response> {
  return handleAssistantRequest(request, {
    idField: "ticketId",
    notFound: "Ticket não encontrado.",
    resolve: async ({ supabase, tenantId, entityId, userName, today }) => {
      const ticket = await getTicket(tenantId, entityId)
      if (!ticket) return null
      return {
        system: buildTicketSystemPrompt({
          ticketLabel: `${ticket.formatted_number} ("${ticket.subject}")`,
          userName,
          today,
        }),
        tools: buildTicketTools({ supabase, tenantId, ticketId: ticket.id }),
      }
    },
  })
}

import { tool } from "ai"
import { z } from "zod"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/database.types"
import { TICKET_PRIORITIES, TICKET_STATUSES } from "@/lib/constants"
import { sanitizeSearchTerm } from "@/lib/search"
import {
  draftReplyTool,
  failTool as fail,
  label,
  noInput,
  ROW_LIMIT,
} from "./common"

type Ctx = {
  supabase: SupabaseClient<Database>
  tenantId: string
  ticketId: string
}

const KB_LIMIT = 5
const EXCERPT_CHARS = 1500

function clip(text: string | null, size = EXCERPT_CHARS) {
  if (!text) return null
  return text.length > size ? `${text.slice(0, size)}…` : text
}

export function buildTicketTools({ supabase, tenantId, ticketId }: Ctx) {
  return {
    getTicket: tool({
      description:
        "Dados do ticket (assunto, descrição, status, prioridade, cliente e contato).",
      inputSchema: noInput,
      execute: async () => {
        const { data, error } = await supabase
          .from("tickets")
          .select(
            "formatted_number, subject, details, status, priority, created_at, company:companies(name), contact:contacts(first_name, last_name)",
          )
          .eq("id", ticketId)
          .eq("tenant_id", tenantId)
          .is("deleted_at", null)
          .maybeSingle()
        if (error) return fail("getTicket", error)
        if (!data) return { ticket: null }
        const { company, contact, ...ticket } = data
        const person = contact as {
          first_name: string
          last_name: string | null
        } | null
        return {
          ticket: {
            ...ticket,
            details: clip(ticket.details, 4000),
            status: label(TICKET_STATUSES, ticket.status),
            priority: label(TICKET_PRIORITIES, ticket.priority),
            company: (company as { name: string } | null)?.name ?? null,
            contact: person
              ? [person.first_name, person.last_name].filter(Boolean).join(" ")
              : null,
          },
        }
      },
    }),

    listReplies: tool({
      description:
        "Conversa do ticket em ordem cronológica. Notas internas vêm marcadas com internal=true e não são vistas pelo cliente.",
      inputSchema: noInput,
      execute: async () => {
        const { data, error } = await supabase
          .from("ticket_replies")
          .select("body, is_internal, created_at, contact_id")
          .eq("tenant_id", tenantId)
          .eq("ticket_id", ticketId)
          .order("created_at", { ascending: true })
          .limit(ROW_LIMIT)
        if (error) return fail("listReplies", error)
        return {
          replies: (data ?? []).map((r) => ({
            from: r.contact_id ? "cliente" : "equipe",
            internal: r.is_internal,
            created_at: r.created_at,
            body: clip(r.body),
          })),
        }
      },
    }),

    searchKnowledgeBase: tool({
      description:
        "Busca artigos publicados da base de conhecimento e perguntas frequentes por palavra-chave.",
      inputSchema: z.object({ query: z.string().min(2).max(80) }),
      execute: async ({ query }) => {
        const term = sanitizeSearchTerm(query)
        if (term.length < 2) return { articles: [], faqs: [] }
        const like = `%${term}%`
        const [articles, faqs] = await Promise.all([
          supabase
            .from("kb_articles")
            .select("title, excerpt, content")
            .eq("tenant_id", tenantId)
            .eq("is_published", true)
            .is("deleted_at", null)
            .or(`title.ilike.${like},content.ilike.${like}`)
            .limit(KB_LIMIT),
          supabase
            .from("faqs")
            .select("question, answer")
            .eq("tenant_id", tenantId)
            .eq("is_published", true)
            .or(`question.ilike.${like},answer.ilike.${like}`)
            .limit(KB_LIMIT),
        ])
        if (articles.error) return fail("searchKnowledgeBase", articles.error)
        if (faqs.error) return fail("searchKnowledgeBase", faqs.error)
        return {
          articles: (articles.data ?? []).map((a) => ({
            title: a.title,
            content: clip(a.content ?? a.excerpt),
          })),
          faqs: (faqs.data ?? []).map((f) => ({
            question: f.question,
            answer: clip(f.answer),
          })),
        }
      },
    }),

    draftReply: draftReplyTool(),
  }
}

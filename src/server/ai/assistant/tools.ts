import { tool } from "ai"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/database.types"
import {
  CONTRACT_STATUSES,
  ESTIMATE_STATUSES,
  INVOICE_STATUSES,
  PROJECT_STATUSES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
} from "@/lib/constants"
import {
  draftEmailTool,
  failTool as fail,
  label,
  noInput,
  proposeTaskTool,
  ROW_LIMIT,
} from "./common"

type Ctx = {
  supabase: SupabaseClient<Database>
  tenantId: string
  companyId: string
}

export function buildAssistantTools({ supabase, tenantId, companyId }: Ctx) {
  return {
    getClientOverview: tool({
      description:
        "Dados cadastrais do cliente e a lista de contatos (nome, cargo, e-mail, telefone).",
      inputSchema: noInput,
      execute: async () => {
        const [company, contacts] = await Promise.all([
          supabase
            .from("companies")
            .select("id, name, website, phone, city, state, country, notes")
            .eq("id", companyId)
            .eq("tenant_id", tenantId)
            .is("deleted_at", null)
            .maybeSingle(),
          supabase
            .from("contacts")
            .select("first_name, last_name, title, email, phone, is_primary")
            .eq("tenant_id", tenantId)
            .eq("company_id", companyId)
            .is("deleted_at", null)
            .limit(ROW_LIMIT),
        ])
        if (company.error) return fail("getClientOverview", company.error)
        if (contacts.error) return fail("getClientOverview", contacts.error)
        return {
          company: company.data,
          contacts: (contacts.data ?? []).map((c) => ({
            name: [c.first_name, c.last_name].filter(Boolean).join(" "),
            title: c.title,
            email: c.email,
            phone: c.phone,
            primary: c.is_primary,
          })),
        }
      },
    }),

    listProjects: tool({
      description: "Projetos do cliente, com status e prazo.",
      inputSchema: noInput,
      execute: async () => {
        const { data, error } = await supabase
          .from("projects")
          .select("id, name, status, start_date, deadline, progress")
          .eq("tenant_id", tenantId)
          .eq("company_id", companyId)
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .limit(ROW_LIMIT)
        if (error) return fail("listProjects", error)
        return {
          projects: (data ?? []).map((p) => ({
            ...p,
            status: label(PROJECT_STATUSES, p.status),
          })),
        }
      },
    }),

    listOpenTasks: tool({
      description: "Tarefas não concluídas dos projetos do cliente.",
      inputSchema: noInput,
      execute: async () => {
        const projects = await supabase
          .from("projects")
          .select("id")
          .eq("tenant_id", tenantId)
          .eq("company_id", companyId)
          .is("deleted_at", null)
        if (projects.error) return fail("listOpenTasks", projects.error)
        const ids = (projects.data ?? []).map((p) => p.id)
        if (ids.length === 0) return { tasks: [] }

        const { data, error } = await supabase
          .from("tasks")
          .select("id, name, status, priority, due_date, project_id")
          .eq("tenant_id", tenantId)
          .in("project_id", ids)
          .neq("status", 5)
          .is("deleted_at", null)
          .order("due_date", { ascending: true })
          .limit(ROW_LIMIT)
        if (error) return fail("listOpenTasks", error)
        return {
          tasks: (data ?? []).map((t) => ({
            ...t,
            status: label(TASK_STATUSES, t.status),
            priority: label(TASK_PRIORITIES, t.priority),
          })),
        }
      },
    }),

    listInvoices: tool({
      description: "Faturas do cliente (número, status, total, vencimento).",
      inputSchema: noInput,
      execute: async () => {
        const { data, error } = await supabase
          .from("invoices")
          .select("formatted_number, status, total, currency, date, due_date")
          .eq("tenant_id", tenantId)
          .eq("company_id", companyId)
          .is("deleted_at", null)
          .order("date", { ascending: false })
          .limit(ROW_LIMIT)
        if (error) return fail("listInvoices", error)
        return {
          invoices: (data ?? []).map((i) => ({
            ...i,
            status: label(INVOICE_STATUSES, i.status),
          })),
        }
      },
    }),

    listEstimates: tool({
      description: "Orçamentos do cliente (número, status, total, validade).",
      inputSchema: noInput,
      execute: async () => {
        const { data, error } = await supabase
          .from("estimates")
          .select(
            "formatted_number, status, total, currency, date, expiry_date",
          )
          .eq("tenant_id", tenantId)
          .eq("company_id", companyId)
          .is("deleted_at", null)
          .order("date", { ascending: false })
          .limit(ROW_LIMIT)
        if (error) return fail("listEstimates", error)
        return {
          estimates: (data ?? []).map((e) => ({
            ...e,
            status: label(ESTIMATE_STATUSES, e.status),
          })),
        }
      },
    }),

    listTickets: tool({
      description:
        "Tickets de suporte do cliente (assunto, status, prioridade).",
      inputSchema: noInput,
      execute: async () => {
        const { data, error } = await supabase
          .from("tickets")
          .select("formatted_number, subject, status, priority, created_at")
          .eq("tenant_id", tenantId)
          .eq("company_id", companyId)
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .limit(ROW_LIMIT)
        if (error) return fail("listTickets", error)
        return {
          tickets: (data ?? []).map((t) => ({
            ...t,
            status: label(TICKET_STATUSES, t.status),
            priority: label(TICKET_PRIORITIES, t.priority),
          })),
        }
      },
    }),

    listContracts: tool({
      description: "Contratos do cliente (título, status, valor, vigência).",
      inputSchema: noInput,
      execute: async () => {
        const { data, error } = await supabase
          .from("contracts")
          .select("title, status, value, start_date, end_date")
          .eq("tenant_id", tenantId)
          .eq("company_id", companyId)
          .is("deleted_at", null)
          .order("start_date", { ascending: false })
          .limit(ROW_LIMIT)
        if (error) return fail("listContracts", error)
        return {
          contracts: (data ?? []).map((c) => ({
            ...c,
            status: label(CONTRACT_STATUSES, c.status),
          })),
        }
      },
    }),

    proposeTask: proposeTaskTool(
      "Propõe uma tarefa num projeto deste cliente. O usuário revisa e confirma; o resultado diz se foi criada.",
    ),

    draftEmail: draftEmailTool(),
  }
}

export type AssistantTools = ReturnType<typeof buildAssistantTools>

export type { AssistantUIMessage } from "./common"

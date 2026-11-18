import { tool } from "ai"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/database.types"
import {
  MILESTONE_STATUSES,
  PROJECT_STATUSES,
  TASK_PRIORITIES,
  TASK_STATUSES,
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
  projectId: string
  companyId: string | null
}

const DONE_TASK = 5

export function buildProjectTools({
  supabase,
  tenantId,
  projectId,
  companyId,
}: Ctx) {
  const tools = {
    getProjectOverview: tool({
      description:
        "Dados do projeto (status, datas, progresso, horas estimadas), o cliente, a equipe e os contatos do cliente.",
      inputSchema: noInput,
      execute: async () => {
        const [project, members, contacts] = await Promise.all([
          supabase
            .from("projects")
            .select(
              "name, description, status, start_date, deadline, progress, estimated_hours, company:companies(name)",
            )
            .eq("id", projectId)
            .eq("tenant_id", tenantId)
            .is("deleted_at", null)
            .maybeSingle(),
          supabase
            .from("project_members")
            .select("profile:profiles(full_name)")
            .eq("tenant_id", tenantId)
            .eq("project_id", projectId),
          companyId
            ? supabase
                .from("contacts")
                .select("first_name, last_name, title, email, is_primary")
                .eq("tenant_id", tenantId)
                .eq("company_id", companyId)
                .is("deleted_at", null)
                .limit(ROW_LIMIT)
            : Promise.resolve({ data: [], error: null }),
        ])
        if (project.error) return fail("getProjectOverview", project.error)
        if (members.error) return fail("getProjectOverview", members.error)
        if (contacts.error) return fail("getProjectOverview", contacts.error)
        const data = project.data
        return {
          project: data && {
            ...data,
            status: label(PROJECT_STATUSES, data.status),
          },
          team: (members.data ?? []).map(
            (m) =>
              (m.profile as { full_name: string | null } | null)?.full_name ??
              "Membro",
          ),
          contacts: (contacts.data ?? []).map((c) => ({
            name: [c.first_name, c.last_name].filter(Boolean).join(" "),
            title: c.title,
            email: c.email,
            primary: c.is_primary,
          })),
        }
      },
    }),

    listTasks: tool({
      description:
        "Tarefas não concluídas do projeto, ordenadas pelo prazo (as atrasadas primeiro).",
      inputSchema: noInput,
      execute: async () => {
        const { data, error } = await supabase
          .from("tasks")
          .select(
            "name, status, priority, due_date, assignee:profiles!tasks_assignee_id_fkey(full_name)",
          )
          .eq("tenant_id", tenantId)
          .eq("project_id", projectId)
          .neq("status", DONE_TASK)
          .is("deleted_at", null)
          .order("due_date", { ascending: true })
          .limit(ROW_LIMIT)
        if (error) return fail("listTasks", error)
        return {
          tasks: (data ?? []).map((t) => ({
            name: t.name,
            status: label(TASK_STATUSES, t.status),
            priority: label(TASK_PRIORITIES, t.priority),
            due_date: t.due_date,
            assignee:
              (t.assignee as { full_name: string | null } | null)?.full_name ??
              null,
          })),
        }
      },
    }),

    listMilestones: tool({
      description: "Marcos do projeto com status e datas.",
      inputSchema: noInput,
      execute: async () => {
        const { data, error } = await supabase
          .from("milestones")
          .select("name, status, start_date, due_date, date_finished")
          .eq("tenant_id", tenantId)
          .eq("project_id", projectId)
          .is("deleted_at", null)
          .order("position", { ascending: true })
          .limit(ROW_LIMIT)
        if (error) return fail("listMilestones", error)
        return {
          milestones: (data ?? []).map((m) => ({
            ...m,
            status: label(MILESTONE_STATUSES, m.status),
          })),
        }
      },
    }),

    getTimeSummary: tool({
      description:
        "Horas lançadas no projeto: total, faturáveis e faturáveis ainda não faturadas.",
      inputSchema: noInput,
      execute: async () => {
        const { data, error } = await supabase
          .from("time_entries")
          .select("duration_seconds, is_billable, billed")
          .eq("tenant_id", tenantId)
          .eq("project_id", projectId)
          .not("ended_at", "is", null)
        if (error) return fail("getTimeSummary", error)
        let total = 0
        let billable = 0
        let unbilled = 0
        for (const entry of data ?? []) {
          const hours = (entry.duration_seconds ?? 0) / 3600
          total += hours
          if (entry.is_billable) {
            billable += hours
            if (!entry.billed) unbilled += hours
          }
        }
        const round = (value: number) => Math.round(value * 100) / 100
        return {
          total_hours: round(total),
          billable_hours: round(billable),
          unbilled_billable_hours: round(unbilled),
        }
      },
    }),

    draftEmail: draftEmailTool(),
  }

  // Tarefa pelo assistente exige o cliente do projeto (a action revalida).
  if (!companyId) return tools
  return {
    ...tools,
    proposeTask: proposeTaskTool(
      "Propõe uma tarefa neste projeto (use o ID do projeto informado nas instruções). O usuário revisa e confirma; o resultado diz se foi criada.",
    ),
  }
}

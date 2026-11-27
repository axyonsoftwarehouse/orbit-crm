import { createClient } from "@/lib/supabase/server"
import {
  addDaysIso,
  APP_TIME_ZONE,
  formatDateTime,
  toDateKey,
} from "@/lib/format"
import { zonedTimeToUtc } from "@/lib/timezone"
import { listOpenNextSteps } from "@/server/queries/lead-next-steps"

export type CalendarItemKind =
  "event" | "task" | "invoice" | "contract" | "next_step"

export type CalendarItem = {
  id: string
  kind: CalendarItemKind
  title: string
  date: string
  time: string | null
  href: string | null
  color: string
}

export type CalendarEvent = {
  id: string
  title: string
  description: string | null
  start_at: string
  end_at: string | null
  company_id: string | null
  project_id: string | null
}

const KIND_COLORS: Record<CalendarItemKind, string> = {
  event: "#0062FF",
  task: "#f59e0b",
  invoice: "#ef4444",
  contract: "#8b5cf6",
  next_step: "#10b981",
}

function localDate(value: string) {
  return toDateKey(value)
}

export async function listMonthEvents(
  tenantId: string,
  fromDate: string,
  toDate: string,
): Promise<CalendarEvent[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("calendar_events")
    .select("id, title, description, start_at, end_at, company_id, project_id")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .gte("start_at", `${fromDate}T00:00:00`)
    .lte("start_at", `${toDate}T23:59:59`)
    .order("start_at", { ascending: true })

  return (data ?? []) as CalendarEvent[]
}

export async function listCalendarItems(
  tenantId: string,
  fromDate: string,
  toDate: string,
): Promise<CalendarItem[]> {
  const supabase = await createClient()

  const fromIso = zonedTimeToUtc(`${fromDate}T00:00`, APP_TIME_ZONE)
  const untilIso = zonedTimeToUtc(
    `${addDaysIso(toDate, 1)}T00:00`,
    APP_TIME_ZONE,
  )

  const [events, tasks, invoices, contracts, nextSteps] = await Promise.all([
    supabase
      .from("calendar_events")
      .select("id, title, start_at")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .gte("start_at", `${fromDate}T00:00:00`)
      .lte("start_at", `${toDate}T23:59:59`),
    supabase
      .from("tasks")
      .select("id, name, due_date")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .neq("status", 5)
      .gte("due_date", fromDate)
      .lte("due_date", toDate),
    supabase
      .from("invoices")
      .select("id, formatted_number, due_date")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .in("status", [1, 3])
      .gte("due_date", fromDate)
      .lte("due_date", toDate),
    supabase
      .from("contracts")
      .select("id, title, end_date")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .gte("end_date", fromDate)
      .lte("end_date", toDate),
    fromIso && untilIso
      ? listOpenNextSteps(tenantId, {
          fromIso: fromIso.toISOString(),
          untilIso: untilIso.toISOString(),
          client: supabase,
        })
      : Promise.resolve([]),
  ])

  const items: CalendarItem[] = []

  for (const row of (events.data ?? []) as {
    id: string
    title: string
    start_at: string
  }[]) {
    items.push({
      id: `event-${row.id}`,
      kind: "event",
      title: row.title,
      date: localDate(row.start_at),
      time: new Date(row.start_at).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      href: null,
      color: KIND_COLORS.event,
    })
  }

  for (const row of (tasks.data ?? []) as {
    id: string
    name: string
    due_date: string
  }[]) {
    items.push({
      id: `task-${row.id}`,
      kind: "task",
      title: row.name,
      date: row.due_date,
      time: null,
      href: `/app/tarefas/${row.id}`,
      color: KIND_COLORS.task,
    })
  }

  for (const row of (invoices.data ?? []) as {
    id: string
    formatted_number: string
    due_date: string
  }[]) {
    items.push({
      id: `invoice-${row.id}`,
      kind: "invoice",
      title: row.formatted_number,
      date: row.due_date,
      time: null,
      href: `/app/faturas/${row.id}`,
      color: KIND_COLORS.invoice,
    })
  }

  for (const row of (contracts.data ?? []) as {
    id: string
    title: string
    end_date: string
  }[]) {
    items.push({
      id: `contract-${row.id}`,
      kind: "contract",
      title: row.title,
      date: row.end_date,
      time: null,
      href: "/app/contratos",
      color: KIND_COLORS.contract,
    })
  }

  for (const step of nextSteps) {
    items.push({
      id: `next-step-${step.id}`,
      kind: "next_step",
      title: step.next_step_note
        ? `${step.lead_name}: ${step.next_step_note}`
        : step.lead_name,
      date: localDate(step.next_step_at),
      time: formatDateTime(step.next_step_at, { timeStyle: "short" }),
      href: `/app/leads/${step.lead_id}`,
      color: KIND_COLORS.next_step,
    })
  }

  return items.sort((a, b) => a.date.localeCompare(b.date))
}

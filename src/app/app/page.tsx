import Link from "next/link"
import { Building2, Clock, FolderKanban, ListChecks } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard } from "@/components/app/stat-card"
import { ProgressBar, ProjectStatusBadge } from "@/components/app/project-bits"
import { InvoiceStatusBadge } from "@/components/app/document-status-badge"
import { TASK_STATUSES } from "@/lib/constants"
import { formatDate, formatMoney } from "@/lib/format"
import { formatDuration } from "@/server/queries/time"
import { getMemberships } from "@/lib/auth"
import { getActiveTenant } from "@/lib/tenant"
import { createClient } from "@/lib/supabase/server"
import { listProjects } from "@/server/queries/projects"
import { listTasks } from "@/server/queries/tasks"

type InvoiceLite = {
  id: string
  formatted_number: string
  status: number
  total: number
  due_date: string | null
  date: string
  company: { name: string } | null
}

export default async function DashboardPage() {
  const memberships = await getMemberships()
  const active = await getActiveTenant(memberships)
  if (!active) return null

  const supabase = await createClient()
  const tenantId = active.tenantId

  const [
    companies,
    projectsCount,
    openTasksCount,
    timeRows,
    projects,
    tasks,
    invoices,
    payments,
  ] = await Promise.all([
    supabase
      .from("companies")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .is("deleted_at", null),
    supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .is("deleted_at", null),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .neq("status", 5),
    supabase
      .from("time_entries")
      .select("started_at, duration_seconds")
      .eq("tenant_id", tenantId),
    listProjects(tenantId),
    listTasks(tenantId),
    supabase
      .from("invoices")
      .select(
        "id, formatted_number, status, total, due_date, date, company:companies(name)",
      )
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .order("date", { ascending: false }),
    supabase
      .from("payments")
      .select("invoice_id, amount")
      .eq("tenant_id", tenantId),
  ])

  const entries = (timeRows.data ?? []) as {
    started_at: string
    duration_seconds: number | null
  }[]
  const totalSeconds = entries.reduce(
    (sum, row) => sum + Number(row.duration_seconds ?? 0),
    0,
  )

  const days: { label: string; date: string; seconds: number }[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - i)
    days.push({
      label: String(d.getDate()).padStart(2, "0"),
      date: d.toISOString().slice(0, 10),
      seconds: 0,
    })
  }
  const byDate = new Map(days.map((day) => [day.date, day]))
  for (const row of entries) {
    const key = new Date(row.started_at).toISOString().slice(0, 10)
    const day = byDate.get(key)
    if (day) day.seconds += Number(row.duration_seconds ?? 0)
  }
  const maxSeconds = Math.max(...days.map((day) => day.seconds), 1)

  const taskStatusCounts = Object.entries(TASK_STATUSES).map(
    ([key, config]) => ({
      status: Number(key),
      label: config.label,
      color: config.color,
      count: tasks.filter((task) => task.status === Number(key)).length,
    }),
  )
  const taskTotal = tasks.length
  let acc = 0
  const gradient = taskStatusCounts
    .filter((s) => s.count > 0)
    .map((s) => {
      const start = (acc / taskTotal) * 100
      acc += s.count
      const end = (acc / taskTotal) * 100
      return `${s.color} ${start}% ${end}%`
    })
    .join(", ")

  const invoiceList = (invoices.data ?? []) as unknown as InvoiceLite[]
  const paidByInvoice = new Map<string, number>()
  for (const payment of (payments.data ?? []) as {
    invoice_id: string
    amount: number
  }[]) {
    paidByInvoice.set(
      payment.invoice_id,
      (paidByInvoice.get(payment.invoice_id) ?? 0) + Number(payment.amount),
    )
  }
  let receivable = 0
  let received = 0
  for (const invoice of invoiceList) {
    const paid = paidByInvoice.get(invoice.id) ?? 0
    received += paid
    if (invoice.status === 1 || invoice.status === 3) {
      receivable += Math.max(0, Number(invoice.total) - paid)
    }
  }

  const recentProjects = projects.slice(0, 5)
  const recentInvoices = invoiceList.slice(0, 4)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Visão geral</h1>
        <p className="text-muted-foreground text-sm">
          Resumo de {active.tenant.name}.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Clientes"
          value={String(companies.count ?? 0)}
          icon={Building2}
          tone="primary"
        />
        <StatCard
          label="Projetos"
          value={String(projectsCount.count ?? 0)}
          icon={FolderKanban}
          tone="blue"
        />
        <StatCard
          label="Tarefas abertas"
          value={String(openTasksCount.count ?? 0)}
          icon={ListChecks}
          tone="yellow"
        />
        <StatCard
          label="Horas registradas"
          value={formatDuration(totalSeconds)}
          icon={Clock}
          tone="green"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">
              Horas nos últimos 14 dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-44 items-end gap-1.5">
              {days.map((day) => (
                <div
                  key={day.date}
                  className="flex h-full flex-1 flex-col items-center justify-end gap-1"
                  title={`${day.label}: ${formatDuration(day.seconds)}`}
                >
                  <div
                    className="bg-primary/85 w-full rounded-t-md"
                    style={{
                      height: `${Math.max((day.seconds / maxSeconds) * 100, day.seconds > 0 ? 4 : 0)}%`,
                    }}
                  />
                  <span className="text-muted-foreground text-[10px]">
                    {day.label}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tarefas por status</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-5">
            {taskTotal > 0 ? (
              <div
                className="relative size-28 shrink-0 rounded-full"
                style={{ background: `conic-gradient(${gradient})` }}
              >
                <div className="bg-card absolute inset-4 flex flex-col items-center justify-center rounded-full">
                  <span className="font-heading text-xl font-semibold">
                    {taskTotal}
                  </span>
                  <span className="text-muted-foreground text-[10px]">
                    tarefas
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-muted size-28 shrink-0 rounded-full" />
            )}
            <ul className="space-y-1.5 text-sm">
              {taskStatusCounts.map((status) => (
                <li key={status.status} className="flex items-center gap-2">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: status.color }}
                  />
                  <span className="text-muted-foreground flex-1">
                    {status.label}
                  </span>
                  <span className="font-medium">{status.count}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Projetos recentes</CardTitle>
            <Link
              href="/app/projetos"
              className="text-primary text-xs hover:underline"
            >
              Ver todos
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentProjects.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Nenhum projeto ainda.
              </p>
            ) : (
              recentProjects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/app/projetos/${project.id}`}
                      className="block truncate text-sm font-medium hover:underline"
                    >
                      {project.name}
                    </Link>
                    <div className="text-muted-foreground truncate text-xs">
                      {project.company?.name ?? "Interno"}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <ProjectStatusBadge status={project.status} />
                    <ProgressBar value={project.progress} />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Financeiro</CardTitle>
            <Link
              href="/app/faturas"
              className="text-primary text-xs hover:underline"
            >
              Ver faturas
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border p-3">
                <div className="text-muted-foreground text-xs">A receber</div>
                <div className="font-heading text-lg font-semibold text-[#e08600] dark:text-[#ffc542]">
                  {formatMoney(receivable)}
                </div>
              </div>
              <div className="rounded-xl border p-3">
                <div className="text-muted-foreground text-xs">Recebido</div>
                <div className="font-heading text-lg font-semibold text-[#12a06b] dark:text-[#3dd598]">
                  {formatMoney(received)}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {recentInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <Link
                    href={`/app/faturas/${invoice.id}`}
                    className="font-medium hover:underline"
                  >
                    {invoice.formatted_number}
                  </Link>
                  <span className="text-muted-foreground hidden flex-1 truncate text-xs sm:block">
                    {invoice.company?.name ?? "—"}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {formatDate(invoice.due_date)}
                  </span>
                  <InvoiceStatusBadge
                    status={invoice.status}
                    dueDate={invoice.due_date}
                  />
                  <span className="w-24 text-right">
                    {formatMoney(Number(invoice.total))}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

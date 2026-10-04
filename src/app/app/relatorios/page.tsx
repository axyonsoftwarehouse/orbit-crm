import Link from "next/link"
import {
  BarChart3,
  Clock,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StatCard } from "@/components/app/stat-card"
import { StatusPill } from "@/components/app/status-pill"
import { cn } from "@/lib/utils"
import { formatMoney } from "@/lib/format"
import { formatDuration } from "@/server/queries/time"
import {
  buildLeadConversionBySource,
  buildProductivity,
  buildProfitability,
} from "@/lib/reports"
import { getMemberships } from "@/lib/auth"
import { getActiveTenant } from "@/lib/tenant"
import { createClient } from "@/lib/supabase/server"
import { listCompanies } from "@/server/queries/companies"
import { listTenantMembers } from "@/server/queries/projects"
import { listLeadStatuses, listLeads } from "@/server/queries/leads"

const RANGES = [
  { key: "30", label: "30 dias" },
  { key: "90", label: "90 dias" },
  { key: "365", label: "12 meses" },
]

const EMPTY_IDS = ["00000000-0000-0000-0000-000000000000"]

const fieldClass =
  "border-input bg-background dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 h-8 rounded-lg border px-2 text-sm outline-none focus-visible:ring-3"

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; company?: string; project?: string }>
}) {
  const { range = "90", company, project } = await searchParams
  const days = Number(range)
  const since = new Date(Date.now() - days * 86_400_000)
  const sinceISO = since.toISOString()
  const sinceDate = sinceISO.slice(0, 10)

  const memberships = await getMemberships()
  const active = await getActiveTenant(memberships)
  if (!active) return null

  const supabase = await createClient()
  const tenantId = active.tenantId

  const [companies, projectsRes, leads, statuses, members] = await Promise.all([
    listCompanies(tenantId),
    supabase
      .from("projects")
      .select("id, name, company_id")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .order("name"),
    listLeads(tenantId),
    listLeadStatuses(tenantId),
    listTenantMembers(tenantId),
  ])

  const projectRows = (projectsRes.data ?? []) as {
    id: string
    name: string
    company_id: string | null
  }[]
  const projectOptions = company
    ? projectRows.filter((row) => row.company_id === company)
    : projectRows
  const companyProjectIds = company
    ? projectRows
        .filter((row) => row.company_id === company)
        .map((row) => row.id)
    : null

  let invoicesQuery = supabase
    .from("invoices")
    .select(
      "id, total, status, date, company_id, project_id, company:companies(name)",
    )
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .gte("date", sinceDate)
  if (company) invoicesQuery = invoicesQuery.eq("company_id", company)
  if (project) invoicesQuery = invoicesQuery.eq("project_id", project)

  let allInvoicesQuery = supabase
    .from("invoices")
    .select("total, status, date, company_id, project_id")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
  if (company) allInvoicesQuery = allInvoicesQuery.eq("company_id", company)
  if (project) allInvoicesQuery = allInvoicesQuery.eq("project_id", project)

  let entriesQuery = supabase
    .from("time_entries")
    .select("project_id, user_id, duration_seconds, is_billable, rate")
    .eq("tenant_id", tenantId)
    .gte("started_at", sinceISO)
  if (project) {
    entriesQuery = entriesQuery.eq("project_id", project)
  } else if (company) {
    entriesQuery = entriesQuery.in(
      "project_id",
      companyProjectIds?.length ? companyProjectIds : EMPTY_IDS,
    )
  }

  let expensesQuery = supabase
    .from("expenses")
    .select(
      "title, category, amount, billable, date, company_id, project_id, project:projects(name)",
    )
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .gte("date", sinceDate)
  if (company) expensesQuery = expensesQuery.eq("company_id", company)
  if (project) expensesQuery = expensesQuery.eq("project_id", project)

  let tasksQuery = supabase
    .from("tasks")
    .select("assignee_id, status, updated_at")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .gte("updated_at", sinceISO)
  if (project) {
    tasksQuery = tasksQuery.eq("project_id", project)
  } else if (company) {
    tasksQuery = tasksQuery.in(
      "project_id",
      companyProjectIds?.length ? companyProjectIds : EMPTY_IDS,
    )
  }

  const [invoices, allInvoices, payments, entries, expenses, tasks] =
    await Promise.all([
      invoicesQuery,
      allInvoicesQuery,
      supabase
        .from("payments")
        .select(
          "amount, payment_date, invoice:invoices(company_id, project_id)",
        )
        .eq("tenant_id", tenantId)
        .gte("payment_date", sinceDate),
      entriesQuery,
      expensesQuery,
      tasksQuery,
    ])

  // ---------- Funil de leads ----------
  const leadTotal = leads.length
  const wonStatus = statuses.find((s) => s.is_won)
  const wonCount = wonStatus
    ? leads.filter((l) => l.status?.id === wonStatus.id).length
    : 0
  const conversion =
    leadTotal > 0 ? Math.round((wonCount / leadTotal) * 100) : 0
  const pipelineValue = leads
    .filter(
      (l) =>
        !l.status?.id || !statuses.find((s) => s.id === l.status?.id)?.is_lost,
    )
    .reduce((sum, l) => sum + Number(l.value ?? 0), 0)

  const byStatus = statuses.map((status) => {
    const items = leads.filter((l) => l.status?.id === status.id)
    return {
      status,
      count: items.length,
      value: items.reduce((sum, l) => sum + Number(l.value ?? 0), 0),
    }
  })
  const maxStatus = Math.max(...byStatus.map((s) => s.count), 1)

  const conversionRows = buildLeadConversionBySource(leads, statuses)

  // ---------- Financeiro ----------
  const invoiceList = (invoices.data ?? []) as unknown as {
    id: string
    total: number
    status: number
    date: string
    company_id: string | null
    project_id: string | null
    company: { name: string } | null
  }[]
  const billed = invoiceList.reduce((sum, i) => sum + Number(i.total), 0)
  const paymentRows = (payments.data ?? []) as unknown as {
    amount: number
    invoice: { company_id: string | null; project_id: string | null } | null
  }[]
  const filteredPayments = paymentRows.filter((payment) => {
    if (company && payment.invoice?.company_id !== company) return false
    if (project && payment.invoice?.project_id !== project) return false
    return true
  })
  const received = filteredPayments.reduce(
    (sum, p) => sum + Number(p.amount),
    0,
  )
  const open = invoiceList
    .filter((i) => i.status === 1 || i.status === 3)
    .reduce((sum, i) => sum + Number(i.total), 0)

  const months: { key: string; label: string; total: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - i)
    months.push({
      key: d.toISOString().slice(0, 7),
      label: d.toLocaleDateString("pt-BR", { month: "short" }),
      total: 0,
    })
  }
  for (const invoice of (allInvoices.data ?? []) as {
    total: number
    status: number
    date: string
  }[]) {
    if (invoice.status === 5) continue
    const month = months.find((m) => m.key === String(invoice.date).slice(0, 7))
    if (month) month.total += Number(invoice.total)
  }
  const maxMonth = Math.max(...months.map((m) => m.total), 1)

  const byClient = new Map<string, number>()
  for (const invoice of invoiceList) {
    const name = invoice.company?.name ?? "—"
    byClient.set(name, (byClient.get(name) ?? 0) + Number(invoice.total))
  }
  const topClients = [...byClient.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  // ---------- Rentabilidade ----------
  const revenueByProject = new Map<string, number>()
  const revenueByCompany = new Map<string, number>()
  for (const invoice of invoiceList) {
    if (invoice.project_id) {
      revenueByProject.set(
        invoice.project_id,
        (revenueByProject.get(invoice.project_id) ?? 0) + Number(invoice.total),
      )
    }
    if (invoice.company_id) {
      revenueByCompany.set(
        invoice.company_id,
        (revenueByCompany.get(invoice.company_id) ?? 0) + Number(invoice.total),
      )
    }
  }

  // ---------- Horas ----------
  const timeRows = (entries.data ?? []) as {
    project_id: string
    user_id: string
    duration_seconds: number | null
    is_billable: boolean
    rate: number | null
  }[]
  const totalSeconds = timeRows.reduce(
    (sum, t) => sum + Number(t.duration_seconds ?? 0),
    0,
  )
  let billableSeconds = 0
  let billableAmount = 0
  for (const row of timeRows) {
    if (row.is_billable) {
      billableSeconds += Number(row.duration_seconds ?? 0)
      billableAmount +=
        (Number(row.duration_seconds ?? 0) / 3600) * Number(row.rate ?? 0)
    }
  }

  const projectNameById = new Map(projectRows.map((p) => [p.id, p.name]))
  const byProject = new Map<string, number>()
  for (const row of timeRows) {
    const name = projectNameById.get(row.project_id) ?? "—"
    byProject.set(
      name,
      (byProject.get(name) ?? 0) + Number(row.duration_seconds ?? 0),
    )
  }
  const topProjects = [...byProject.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)

  const userNameById = new Map(members.map((m) => [m.user_id, m.full_name]))
  const byUser = new Map<string, number>()
  for (const row of timeRows) {
    const name = userNameById.get(row.user_id) ?? "—"
    byUser.set(
      name,
      (byUser.get(name) ?? 0) + Number(row.duration_seconds ?? 0),
    )
  }
  const topUsers = [...byUser.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)

  const productivity = buildProductivity(
    members,
    (tasks.data ?? []) as {
      assignee_id: string | null
      status: number
      updated_at: string
    }[],
    timeRows,
    since.getTime(),
  )

  // ---------- Despesas ----------
  const expenseRows = (expenses.data ?? []) as unknown as {
    title: string
    category: string | null
    amount: number
    billable: boolean
    company_id: string | null
    project_id: string | null
    project: { name: string } | null
  }[]
  const expenseTotal = expenseRows.reduce(
    (sum, row) => sum + Number(row.amount),
    0,
  )
  const expenseBillable = expenseRows
    .filter((row) => row.billable)
    .reduce((sum, row) => sum + Number(row.amount), 0)

  const expenseByProject = new Map<string, number>()
  const expenseByCompany = new Map<string, number>()
  for (const row of expenseRows) {
    if (row.project_id) {
      expenseByProject.set(
        row.project_id,
        (expenseByProject.get(row.project_id) ?? 0) + Number(row.amount),
      )
    }
    if (row.company_id) {
      expenseByCompany.set(
        row.company_id,
        (expenseByCompany.get(row.company_id) ?? 0) + Number(row.amount),
      )
    }
  }

  const profitByProject = buildProfitability(
    projectRows.map((p) => ({ id: p.id, label: p.name })),
    revenueByProject,
    expenseByProject,
  ).slice(0, 8)
  const profitByClient = buildProfitability(
    companies.map((c) => ({ id: c.id, label: c.name })),
    revenueByCompany,
    expenseByCompany,
  ).slice(0, 8)

  const byCategory = new Map<string, number>()
  for (const row of expenseRows) {
    const key = row.category || "Sem categoria"
    byCategory.set(key, (byCategory.get(key) ?? 0) + Number(row.amount))
  }
  const topCategories = [...byCategory.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
  const maxCategory = Math.max(...topCategories.map((c) => c[1]), 1)

  const topExpenseProjects = topProjectsByExpense(expenseRows)

  const rangeHref = (key: string) => {
    const params = new URLSearchParams({ range: key })
    if (company) params.set("company", company)
    if (project) params.set("project", project)
    return `/app/relatorios?${params.toString()}`
  }

  const hasFilter = Boolean(company || project)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground text-sm">
            Funil de leads, financeiro, rentabilidade, produtividade, despesas e
            horas.
          </p>
        </div>
        <div className="bg-muted inline-flex items-center gap-1 rounded-full p-1">
          {RANGES.map((item) => (
            <Link
              key={item.key}
              href={rangeHref(item.key)}
              className={cn(
                "rounded-full px-3 py-1 text-sm",
                range === item.key && "bg-card font-medium shadow-sm",
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      <form
        method="get"
        action="/app/relatorios"
        className="flex flex-wrap items-end gap-2"
      >
        <input type="hidden" name="range" value={range} />
        <select
          name="company"
          defaultValue={company ?? ""}
          className={fieldClass}
        >
          <option value="">Todos os clientes</option>
          {companies.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <select
          name="project"
          defaultValue={project ?? ""}
          className={fieldClass}
        >
          <option value="">Todos os projetos</option>
          {projectOptions.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline" size="sm">
          Filtrar
        </Button>
        {hasFilter ? (
          <Link
            href={`/app/relatorios?range=${range}`}
            className="text-muted-foreground text-sm hover:underline"
          >
            Limpar
          </Link>
        ) : null}
      </form>

      {/* Funil de leads */}
      <Card>
        <CardHeader className="flex-row items-center gap-2">
          <Target className="text-primary size-4" />
          <CardTitle className="text-base">Funil de leads</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Leads"
              value={String(leadTotal)}
              icon={Target}
              tone="primary"
            />
            <StatCard
              label={`Ganhos (${conversion}%)`}
              value={String(wonCount)}
              icon={BarChart3}
              tone="green"
            />
            <StatCard
              label="Valor no pipeline"
              value={formatMoney(pipelineValue)}
              icon={Wallet}
              tone="blue"
            />
          </div>

          <div className="space-y-2">
            {byStatus.map((row) => (
              <div
                key={row.status.id}
                className="flex items-center gap-3 text-sm"
              >
                <span className="w-32 shrink-0">
                  <StatusPill name={row.status.name} color={row.status.color} />
                </span>
                <div className="bg-muted h-2.5 flex-1 overflow-hidden rounded-full">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(row.count / maxStatus) * 100}%`,
                      backgroundColor: row.status.color,
                    }}
                  />
                </div>
                <span className="w-10 text-right">{row.count}</span>
                <span className="text-muted-foreground w-28 text-right text-xs">
                  {formatMoney(row.value)}
                </span>
              </div>
            ))}
          </div>

          {conversionRows.length > 0 ? (
            <div className="space-y-2">
              <div className="text-muted-foreground text-xs">
                Conversão por origem
              </div>
              <div className="overflow-hidden rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Origem</TableHead>
                      <TableHead className="text-right">Leads</TableHead>
                      <TableHead className="text-right">Ganhos</TableHead>
                      <TableHead className="text-right">Conversão</TableHead>
                      <TableHead className="text-right">Valor ganho</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {conversionRows.map((row) => (
                      <TableRow key={row.sourceId ?? "none"}>
                        <TableCell className="font-medium">
                          {row.source}
                        </TableCell>
                        <TableCell className="text-right">
                          {row.total}
                        </TableCell>
                        <TableCell className="text-right">{row.won}</TableCell>
                        <TableCell className="text-right">
                          {row.rate}%
                        </TableCell>
                        <TableCell className="text-right">
                          {formatMoney(row.wonValue)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Financeiro */}
      <Card>
        <CardHeader className="flex-row items-center gap-2">
          <Wallet className="text-primary size-4" />
          <CardTitle className="text-base">Financeiro ({range}d)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Faturado"
              value={formatMoney(billed)}
              icon={Wallet}
              tone="primary"
            />
            <StatCard
              label="Recebido"
              value={formatMoney(received)}
              icon={Wallet}
              tone="green"
            />
            <StatCard
              label="Em aberto"
              value={formatMoney(open)}
              icon={Wallet}
              tone="yellow"
            />
          </div>

          <div>
            <div className="text-muted-foreground mb-2 text-xs">
              Faturamento (6 meses)
            </div>
            <div className="flex h-40 items-end gap-4">
              {months.map((month) => (
                <div
                  key={month.key}
                  className="flex h-full flex-1 flex-col items-center justify-end gap-1"
                  title={formatMoney(month.total)}
                >
                  <span className="text-muted-foreground text-[10px]">
                    {formatMoney(month.total)}
                  </span>
                  <div
                    className="w-full rounded-t-md bg-[#0062ff]"
                    style={{
                      height: `${Math.max((month.total / maxMonth) * 100, month.total > 0 ? 4 : 0)}%`,
                    }}
                  />
                  <span className="text-muted-foreground text-xs capitalize">
                    {month.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {topClients.length > 0 ? (
            <div className="space-y-2">
              <div className="text-muted-foreground text-xs">
                Top clientes por faturamento
              </div>
              {topClients.map(([name, value]) => (
                <div
                  key={name}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="truncate">{name}</span>
                  <span className="font-medium">{formatMoney(value)}</span>
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Rentabilidade */}
      <Card>
        <CardHeader className="flex-row items-center gap-2">
          <TrendingUp className="text-primary size-4" />
          <CardTitle className="text-base">Rentabilidade ({range}d)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-2">
          <ProfitTable title="Por projeto" rows={profitByProject} />
          <ProfitTable title="Por cliente" rows={profitByClient} />
        </CardContent>
      </Card>

      {/* Produtividade */}
      <Card>
        <CardHeader className="flex-row items-center gap-2">
          <BarChart3 className="text-primary size-4" />
          <CardTitle className="text-base">
            Produtividade da equipe ({range}d)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {productivity.length === 0 ? (
            <p className="text-muted-foreground text-sm">Sem dados.</p>
          ) : (
            <div className="overflow-hidden rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pessoa</TableHead>
                    <TableHead className="text-right">
                      Tarefas concluídas
                    </TableHead>
                    <TableHead className="text-right">Horas</TableHead>
                    <TableHead className="text-right">
                      Valor faturável
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productivity.map((row) => (
                    <TableRow key={row.userId}>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell className="text-right">
                        {row.tasksDone}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {formatDuration(row.seconds)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatMoney(row.billableAmount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Despesas */}
      <Card>
        <CardHeader className="flex-row items-center gap-2">
          <TrendingDown className="text-primary size-4" />
          <CardTitle className="text-base">Despesas ({range}d)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Total"
              value={formatMoney(expenseTotal)}
              icon={TrendingDown}
              tone="yellow"
            />
            <StatCard
              label="Faturáveis"
              value={formatMoney(expenseBillable)}
              icon={TrendingDown}
              tone="blue"
            />
            <StatCard
              label="Lançamentos"
              value={String(expenseRows.length)}
              icon={TrendingDown}
              tone="primary"
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="text-muted-foreground text-xs">Por categoria</div>
              {topCategories.length === 0 ? (
                <p className="text-muted-foreground text-sm">Sem dados.</p>
              ) : (
                topCategories.map(([name, value]) => (
                  <div key={name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate">{name}</span>
                      <span className="font-medium">{formatMoney(value)}</span>
                    </div>
                    <div className="bg-muted h-2 overflow-hidden rounded-full">
                      <div
                        className="h-full rounded-full bg-[#ff974a]"
                        style={{ width: `${(value / maxCategory) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="space-y-2">
              <div className="text-muted-foreground text-xs">Por projeto</div>
              {topExpenseProjects.length === 0 ? (
                <p className="text-muted-foreground text-sm">Sem dados.</p>
              ) : (
                topExpenseProjects.map(([name, value]) => (
                  <div
                    key={name}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="truncate">{name}</span>
                    <span className="font-medium">{formatMoney(value)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Horas */}
      <Card>
        <CardHeader className="flex-row items-center gap-2">
          <Clock className="text-primary size-4" />
          <CardTitle className="text-base">Horas ({range}d)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Horas totais"
              value={formatDuration(totalSeconds)}
              icon={Clock}
              tone="primary"
            />
            <StatCard
              label="Faturáveis"
              value={formatDuration(billableSeconds)}
              icon={Clock}
              tone="green"
            />
            <StatCard
              label="Valor faturável"
              value={formatMoney(billableAmount)}
              icon={Wallet}
              tone="blue"
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="text-muted-foreground text-xs">Por projeto</div>
              {topProjects.length === 0 ? (
                <p className="text-muted-foreground text-sm">Sem dados.</p>
              ) : (
                topProjects.map(([name, seconds]) => (
                  <div
                    key={name}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="truncate">{name}</span>
                    <span className="font-mono text-xs">
                      {formatDuration(seconds)}
                    </span>
                  </div>
                ))
              )}
            </div>
            <div className="space-y-2">
              <div className="text-muted-foreground text-xs">Por pessoa</div>
              {topUsers.length === 0 ? (
                <p className="text-muted-foreground text-sm">Sem dados.</p>
              ) : (
                topUsers.map(([name, seconds]) => (
                  <div
                    key={name}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="truncate">{name}</span>
                    <span className="font-mono text-xs">
                      {formatDuration(seconds)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ProfitTable({
  title,
  rows,
}: {
  title: string
  rows: {
    id: string
    label: string
    revenue: number
    expense: number
    margin: number
  }[]
}) {
  return (
    <div className="space-y-2">
      <div className="text-muted-foreground text-xs">{title}</div>
      {rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">Sem dados.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  {title === "Por cliente" ? "Cliente" : "Projeto"}
                </TableHead>
                <TableHead className="text-right">Faturado</TableHead>
                <TableHead className="text-right">Despesas</TableHead>
                <TableHead className="text-right">Margem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.label}</TableCell>
                  <TableCell className="text-right">
                    {formatMoney(row.revenue)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatMoney(row.expense)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-medium",
                      row.margin >= 0 ? "text-emerald-600" : "text-red-600",
                    )}
                  >
                    {formatMoney(row.margin)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

function topProjectsByExpense(
  rows: { project: { name: string } | null; amount: number }[],
) {
  const byProject = new Map<string, number>()
  for (const row of rows) {
    const key = row.project?.name ?? "—"
    byProject.set(key, (byProject.get(key) ?? 0) + Number(row.amount))
  }
  return [...byProject.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)
}

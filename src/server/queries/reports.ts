import { createClient } from "@/lib/supabase/server"
import { listCompanies } from "@/server/queries/companies"
import { listTenantMembers } from "@/server/queries/projects"
import {
  listLeadStatuses,
  listLeads,
  type LeadStatus,
} from "@/server/queries/leads"
import {
  buildLeadConversionBySource,
  buildProductivity,
  buildProfitability,
  type LeadConversionRow,
  type ProductivityRow,
  type ProfitRow,
} from "@/lib/reports"

const EMPTY_IDS = ["00000000-0000-0000-0000-000000000000"]

export type ReportFilters = {
  days: number
  companyId?: string
  projectId?: string
}

export type ReportStatusRow = {
  status: LeadStatus
  count: number
  value: number
}

export type ReportMonth = { key: string; label: string; total: number }

export type ReportData = {
  companyOptions: { id: string; name: string }[]
  projectOptions: { id: string; name: string }[]
  leadTotal: number
  wonCount: number
  conversion: number
  pipelineValue: number
  byStatus: ReportStatusRow[]
  maxStatus: number
  conversionRows: LeadConversionRow[]
  billed: number
  received: number
  open: number
  months: ReportMonth[]
  maxMonth: number
  topClients: [string, number][]
  profitByProject: ProfitRow[]
  profitByClient: ProfitRow[]
  productivity: ProductivityRow[]
  expenseTotal: number
  expenseBillable: number
  expenseCount: number
  topCategories: [string, number][]
  maxCategory: number
  topExpenseProjects: [string, number][]
  totalSeconds: number
  billableSeconds: number
  billableAmount: number
  topProjects: [string, number][]
  topUsers: [string, number][]
}

export async function getReportData(
  tenantId: string,
  filters: ReportFilters,
): Promise<ReportData> {
  const { companyId: company, projectId: project } = filters
  const since = new Date(Date.now() - filters.days * 86_400_000)
  const sinceISO = since.toISOString()
  const sinceDate = sinceISO.slice(0, 10)

  const supabase = await createClient()

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

  const months: ReportMonth[] = []
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

  const byExpenseProject = new Map<string, number>()
  for (const row of expenseRows) {
    const key = row.project?.name ?? "—"
    byExpenseProject.set(
      key,
      (byExpenseProject.get(key) ?? 0) + Number(row.amount),
    )
  }
  const topExpenseProjects = [...byExpenseProject.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)

  return {
    companyOptions: companies.map((c) => ({ id: c.id, name: c.name })),
    projectOptions: projectOptions.map((p) => ({ id: p.id, name: p.name })),
    leadTotal,
    wonCount,
    conversion,
    pipelineValue,
    byStatus,
    maxStatus,
    conversionRows,
    billed,
    received,
    open,
    months,
    maxMonth,
    topClients,
    profitByProject,
    profitByClient,
    productivity,
    expenseTotal,
    expenseBillable,
    expenseCount: expenseRows.length,
    topCategories,
    maxCategory,
    topExpenseProjects,
    totalSeconds,
    billableSeconds,
    billableAmount,
    topProjects,
    topUsers,
  }
}

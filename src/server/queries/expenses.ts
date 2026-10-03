import { createClient } from "@/lib/supabase/server"

export type Expense = {
  id: string
  title: string
  category: string | null
  amount: number
  date: string
  project_id: string | null
  company_id: string | null
  billable: boolean
  note: string | null
}

export type ExpenseListRow = Expense & {
  project: { id: string; name: string } | null
  company: { id: string; name: string } | null
}

const EXPENSE_COLUMNS =
  "id, title, category, amount, date, project_id, company_id, billable, note, project:projects(id, name), company:companies(id, name)"

export type ExpenseFilters = {
  projectId?: string
  companyId?: string
}

export async function listExpenses(
  tenantId: string,
  filters: ExpenseFilters = {},
): Promise<ExpenseListRow[]> {
  const supabase = await createClient()
  let query = supabase
    .from("expenses")
    .select(EXPENSE_COLUMNS)
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)

  if (filters.projectId) query = query.eq("project_id", filters.projectId)
  if (filters.companyId) query = query.eq("company_id", filters.companyId)

  const { data } = await query.order("date", { ascending: false })
  return (data ?? []) as unknown as ExpenseListRow[]
}

export async function listExpensesPage(
  tenantId: string,
  filters: ExpenseFilters & { page: number; pageSize: number },
): Promise<{ rows: ExpenseListRow[]; total: number }> {
  const supabase = await createClient()
  let query = supabase
    .from("expenses")
    .select(EXPENSE_COLUMNS, { count: "exact" })
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)

  if (filters.projectId) query = query.eq("project_id", filters.projectId)
  if (filters.companyId) query = query.eq("company_id", filters.companyId)

  const from = (filters.page - 1) * filters.pageSize
  const { data, count } = await query
    .order("date", { ascending: false })
    .range(from, from + filters.pageSize - 1)

  return {
    rows: (data ?? []) as unknown as ExpenseListRow[],
    total: count ?? 0,
  }
}

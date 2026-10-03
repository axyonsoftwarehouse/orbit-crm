import Link from "next/link"
import { Wallet } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Pagination } from "@/components/app/pagination"
import { ExportButton } from "@/components/app/export-button"
import { formatDate, formatMoney } from "@/lib/format"
import { getMemberships } from "@/lib/auth"
import { getActiveTenant } from "@/lib/tenant"
import { PAGE_SIZE, parsePage } from "@/lib/pagination"
import { listCompanies } from "@/server/queries/companies"
import { listProjects } from "@/server/queries/projects"
import { listExpensesPage } from "@/server/queries/expenses"
import { ExpenseFormDialog } from "./expense-form-dialog"
import { DeleteExpenseButton } from "./delete-expense-button"

const fieldClass =
  "border-input bg-background dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 h-8 rounded-lg border px-2 text-sm outline-none focus-visible:ring-3"

export default async function DespesasPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; project?: string; company?: string }>
}) {
  const { page: pageParam, project, company } = await searchParams
  const page = parsePage(pageParam)
  const memberships = await getMemberships()
  const active = await getActiveTenant(memberships)
  if (!active) return null

  const [projects, companies, { rows: expenses, total }] = await Promise.all([
    listProjects(active.tenantId),
    listCompanies(active.tenantId),
    listExpensesPage(active.tenantId, {
      page,
      pageSize: PAGE_SIZE,
      projectId: project,
      companyId: company,
    }),
  ])

  const projectOptions = projects.map((item) => ({
    id: item.id,
    name: item.name,
  }))
  const companyOptions = companies.map((item) => ({
    id: item.id,
    name: item.name,
  }))

  const exportParams = new URLSearchParams()
  if (project) exportParams.set("project", project)
  if (company) exportParams.set("company", company)
  const exportQuery = exportParams.toString()
  const exportHref = exportQuery
    ? `/app/exportar/despesas?${exportQuery}`
    : "/app/exportar/despesas"

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Despesas</h1>
          <p className="text-muted-foreground text-sm">
            {total} despesa(s) · custos por projeto e cliente.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton href={exportHref} />
          <ExpenseFormDialog
            projects={projectOptions}
            companies={companyOptions}
            label="Nova despesa"
          />
        </div>
      </div>

      <form
        method="get"
        action="/app/despesas"
        className="flex flex-wrap items-end gap-2"
      >
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
        <select
          name="company"
          defaultValue={company ?? ""}
          className={fieldClass}
        >
          <option value="">Todos os clientes</option>
          {companyOptions.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline" size="sm">
          Filtrar
        </Button>
        {project || company ? (
          <Link
            href="/app/despesas"
            className="text-muted-foreground text-sm hover:underline"
          >
            Limpar
          </Link>
        ) : null}
      </form>

      <div className="bg-card overflow-hidden rounded-2xl border shadow-[0_6px_24px_-14px_rgba(23,23,37,0.18)] dark:shadow-none">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Projeto</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Faturável</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="w-0" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  <div className="text-muted-foreground flex flex-col items-center gap-1 text-sm">
                    <Wallet className="size-5" />
                    Nenhuma despesa cadastrada ainda.
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="text-muted-foreground">
                    {formatDate(expense.date)}
                  </TableCell>
                  <TableCell className="font-medium">{expense.title}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {expense.category ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {expense.project?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {expense.company?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {expense.billable ? "Sim" : "Não"}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatMoney(Number(expense.amount))}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <ExpenseFormDialog
                        expense={expense}
                        projects={projectOptions}
                        companies={companyOptions}
                        label="Editar"
                      />
                      <DeleteExpenseButton id={expense.id} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination
        page={page}
        total={total}
        hrefFor={(target) => {
          const params = new URLSearchParams()
          if (project) params.set("project", project)
          if (company) params.set("company", company)
          if (target > 1) params.set("page", String(target))
          const query = params.toString()
          return query ? `/app/despesas?${query}` : "/app/despesas"
        }}
      />
    </div>
  )
}

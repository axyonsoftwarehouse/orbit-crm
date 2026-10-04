import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDate, formatMoney } from "@/lib/format"
import { getPortalContact, listPortalExpenses } from "@/server/queries/portal"

export default async function PortalExpensesPage() {
  const contact = await getPortalContact()
  if (!contact) return null

  const expenses = await listPortalExpenses(contact.company_id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-xl font-semibold tracking-tight">
          Despesas faturáveis
        </h1>
        <p className="text-muted-foreground text-sm">
          Custos repassados vinculados aos seus projetos.
        </p>
      </div>

      <div className="bg-card overflow-hidden rounded-2xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Projeto</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-muted-foreground text-center text-sm"
                >
                  Nenhuma despesa faturável ainda.
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
                  <TableCell className="text-right">
                    {formatMoney(Number(expense.amount))}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

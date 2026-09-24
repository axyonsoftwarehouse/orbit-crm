import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  billableAmount,
  formatDuration,
  sumSeconds,
  listTimeEntries,
} from "@/server/queries/time"
import { DeleteTimeEntryButton } from "./delete-time-entry-button"

function currency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

function entryValue(seconds: number, isBillable: boolean, rate: number | null) {
  if (!isBillable || !rate) return "—"
  return currency((seconds / 3600) * Number(rate))
}

export async function TimeEntriesTable({
  tenantId,
  projectId,
  taskId,
  showUser = false,
  title = "Apontamentos",
}: {
  tenantId: string
  projectId?: string
  taskId?: string
  showUser?: boolean
  title?: string
}) {
  const entries = await listTimeEntries(tenantId, { projectId, taskId })
  const total = sumSeconds(entries)
  const amount = billableAmount(entries)

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-base">{title}</CardTitle>
        <div className="text-muted-foreground flex items-center gap-4 text-xs">
          <span>
            Total:{" "}
            <span className="text-foreground font-medium">
              {formatDuration(total)}
            </span>
          </span>
          <span>
            Faturável:{" "}
            <span className="text-foreground font-medium">
              {currency(amount)}
            </span>
          </span>
        </div>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              {showUser ? <TableHead>Usuário</TableHead> : null}
              {!projectId ? <TableHead>Projeto</TableHead> : null}
              {!taskId ? <TableHead>Tarefa</TableHead> : null}
              <TableHead>Duração</TableHead>
              <TableHead>Faturável</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="w-0" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-muted-foreground h-20 text-center text-sm"
                >
                  Nenhum apontamento registrado.
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry) => {
                const seconds =
                  entry.duration_seconds ??
                  Math.max(
                    0,
                    Math.round(
                      (Date.now() - new Date(entry.started_at).getTime()) /
                        1000,
                    ),
                  )
                return (
                  <TableRow key={entry.id}>
                    <TableCell className="text-muted-foreground">
                      {new Date(entry.started_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    {showUser ? (
                      <TableCell>{entry.user_name ?? "—"}</TableCell>
                    ) : null}
                    {!projectId ? (
                      <TableCell className="text-muted-foreground">
                        {entry.project?.name ?? "—"}
                      </TableCell>
                    ) : null}
                    {!taskId ? (
                      <TableCell className="text-muted-foreground">
                        {entry.task?.name ?? "—"}
                      </TableCell>
                    ) : null}
                    <TableCell className="font-mono text-xs">
                      {formatDuration(seconds)}
                      {entry.ended_at === null ? (
                        <span className="text-muted-foreground ml-1">
                          (em andamento)
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell>{entry.is_billable ? "Sim" : "Não"}</TableCell>
                    <TableCell className="text-right">
                      {entryValue(seconds, entry.is_billable, entry.rate)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DeleteTimeEntryButton id={entry.id} />
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

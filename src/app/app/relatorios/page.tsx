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
import { getReportData } from "@/server/queries/reports"
import { getMemberships } from "@/lib/auth"
import { getActiveTenant } from "@/lib/tenant"

const RANGES = [
  { key: "30", label: "30 dias" },
  { key: "90", label: "90 dias" },
  { key: "365", label: "12 meses" },
]

const fieldClass =
  "border-input bg-background dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 h-8 rounded-lg border px-2 text-sm outline-none focus-visible:ring-3"

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; company?: string; project?: string }>
}) {
  const { range = "90", company, project } = await searchParams

  const memberships = await getMemberships()
  const active = await getActiveTenant(memberships)
  if (!active) return null

  const data = await getReportData(active.tenantId, {
    days: Number(range),
    companyId: company,
    projectId: project,
  })

  const {
    companyOptions,
    projectOptions,
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
    expenseCount,
    topCategories,
    maxCategory,
    topExpenseProjects,
    totalSeconds,
    billableSeconds,
    billableAmount,
    topProjects,
    topUsers,
  } = data

  const rangeHref = (key: string) => {
    const params = new URLSearchParams({ range: key })
    if (company) params.set("company", company)
    if (project) params.set("project", project)
    return `/app/relatorios?${params.toString()}`
  }

  const exportHref = (report: string) => {
    const params = new URLSearchParams({ report, range })
    if (company) params.set("company", company)
    if (project) params.set("project", project)
    return `/app/exportar/relatorios?${params.toString()}`
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
          {companyOptions.map((item) => (
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
          <ExportLink href={exportHref("leads")} className="ml-auto" />
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
          <ExportLink href={exportHref("financeiro")} className="ml-auto" />
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
          <ExportLink href={exportHref("rentabilidade")} className="ml-auto" />
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
          <ExportLink href={exportHref("produtividade")} className="ml-auto" />
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
          <ExportLink href={exportHref("despesas")} className="ml-auto" />
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
              value={String(expenseCount)}
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
          <ExportLink href={exportHref("horas")} className="ml-auto" />
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

function ExportLink({ href, className }: { href: string; className?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "text-muted-foreground hover:text-foreground text-xs hover:underline",
        className,
      )}
    >
      Exportar CSV
    </Link>
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

import Link from "next/link"
import { History } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Pagination } from "@/components/app/pagination"
import { getMemberships } from "@/lib/auth"
import { getActiveTenant } from "@/lib/tenant"
import { PAGE_SIZE, parsePage } from "@/lib/pagination"
import { listActivityPage } from "@/server/queries/activity"

const fieldClass =
  "border-input bg-background dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 h-8 rounded-lg border px-2 text-sm outline-none focus-visible:ring-3"

const ENTITIES: Record<string, { label: string; base: string }> = {
  companies: { label: "Cliente", base: "/app/clientes" },
  contacts: { label: "Contato", base: "/app/clientes" },
  projects: { label: "Projeto", base: "/app/projetos" },
  tasks: { label: "Tarefa", base: "/app/tarefas" },
  invoices: { label: "Fatura", base: "/app/faturas" },
  payments: { label: "Pagamento", base: "/app/faturas" },
  estimates: { label: "Orçamento", base: "/app/orcamentos" },
  expenses: { label: "Despesa", base: "/app/despesas" },
  contracts: { label: "Contrato", base: "/app/contratos" },
  leads: { label: "Lead", base: "/app/leads" },
  tickets: { label: "Ticket", base: "/app/tickets" },
}

const ACTIONS: Record<string, string> = {
  insert: "criou",
  update: "atualizou",
  delete: "excluiu",
}

function entityHref(entity: string, entityId: string | null) {
  const config = ENTITIES[entity]
  if (!config) return null
  const perId = [
    "companies",
    "projects",
    "tasks",
    "invoices",
    "estimates",
    "leads",
    "tickets",
  ]
  if (entityId && perId.includes(entity)) return `${config.base}/${entityId}`
  return config.base
}

export default async function AtividadesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; entity?: string }>
}) {
  const { page: pageParam, entity } = await searchParams
  const page = parsePage(pageParam)
  const memberships = await getMemberships()
  const active = await getActiveTenant(memberships)
  if (!active) return null

  const { rows, total } = await listActivityPage(active.tenantId, {
    page,
    pageSize: PAGE_SIZE,
    entity,
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Atividades</h1>
          <p className="text-muted-foreground text-sm">
            {total} registro(s) · trilha de auditoria da empresa.
          </p>
        </div>
      </div>

      <form
        method="get"
        action="/app/atividades"
        className="flex flex-wrap items-end gap-2"
      >
        <select
          name="entity"
          defaultValue={entity ?? ""}
          className={fieldClass}
        >
          <option value="">Todas as entidades</option>
          {Object.entries(ENTITIES).map(([key, config]) => (
            <option key={key} value={key}>
              {config.label}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline" size="sm">
          Filtrar
        </Button>
        {entity ? (
          <Link
            href="/app/atividades"
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
              <TableHead>Usuário</TableHead>
              <TableHead>Entidade</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead className="w-0" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <div className="text-muted-foreground flex flex-col items-center gap-1 text-sm">
                    <History className="size-5" />
                    Nenhuma atividade registrada ainda.
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const href = entityHref(row.entity, row.entity_id)
                return (
                  <TableRow key={row.id}>
                    <TableCell className="text-muted-foreground">
                      {new Date(row.created_at).toLocaleString("pt-BR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </TableCell>
                    <TableCell>{row.actor?.full_name ?? "Sistema"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {ENTITIES[row.entity]?.label ?? row.entity}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {ACTIONS[row.action] ?? row.action}
                    </TableCell>
                    <TableCell className="text-right">
                      {href ? (
                        <Link
                          href={href}
                          className="text-primary text-sm hover:underline"
                        >
                          Ver
                        </Link>
                      ) : null}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination
        page={page}
        total={total}
        hrefFor={(target) => {
          const params = new URLSearchParams()
          if (entity) params.set("entity", entity)
          if (target > 1) params.set("page", String(target))
          const query = params.toString()
          return query ? `/app/atividades?${query}` : "/app/atividades"
        }}
      />
    </div>
  )
}

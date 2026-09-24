import Link from "next/link"
import { Target } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StatusPill } from "@/components/app/status-pill"
import { cn } from "@/lib/utils"
import { formatDate, formatMoney } from "@/lib/format"
import { getMemberships } from "@/lib/auth"
import { getActiveTenant } from "@/lib/tenant"
import { listTenantMembers } from "@/server/queries/projects"
import {
  listLeadSources,
  listLeadStatuses,
  listLeads,
} from "@/server/queries/leads"
import { LeadFormDialog } from "./lead-form-dialog"
import { LeadSettingsDialog } from "./lead-settings"
import { LeadKanban } from "./lead-kanban"

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; view?: string }>
}) {
  const { status, view } = await searchParams
  const kanban = view === "kanban"

  const memberships = await getMemberships()
  const active = await getActiveTenant(memberships)
  if (!active) return null

  const [leads, statuses, sources, members] = await Promise.all([
    listLeads(active.tenantId, { statusId: kanban ? undefined : status }),
    listLeadStatuses(active.tenantId),
    listLeadSources(active.tenantId),
    listTenantMembers(active.tenantId),
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Leads</h1>
          <p className="text-muted-foreground text-sm">
            {leads.length} lead(s) · pipeline comercial.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-muted inline-flex items-center gap-1 rounded-full p-1">
            <Link
              href="/app/leads"
              className={cn(
                "rounded-full px-3 py-1 text-sm",
                !kanban && "bg-card font-medium shadow-sm",
              )}
            >
              Lista
            </Link>
            <Link
              href="/app/leads?view=kanban"
              className={cn(
                "rounded-full px-3 py-1 text-sm",
                kanban && "bg-card font-medium shadow-sm",
              )}
            >
              Kanban
            </Link>
          </div>
          <LeadSettingsDialog statuses={statuses} sources={sources} />
          <LeadFormDialog
            statuses={statuses}
            sources={sources}
            members={members}
            label="Novo lead"
          />
        </div>
      </div>

      {kanban ? (
        <LeadKanban statuses={statuses} leads={leads} />
      ) : (
        <>
          {statuses.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              <Link
                href="/app/leads"
                className={cn(
                  "rounded-full border px-3 py-1 text-xs",
                  !status
                    ? "border-primary bg-primary/10 text-primary"
                    : "text-muted-foreground",
                )}
              >
                Todos
              </Link>
              {statuses.map((item) => (
                <Link
                  key={item.id}
                  href={`/app/leads?status=${item.id}`}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs",
                    status === item.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "text-muted-foreground",
                  )}
                >
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  {item.name}
                </Link>
              ))}
            </div>
          ) : null}

          <div className="bg-card overflow-hidden rounded-2xl border shadow-[0_6px_24px_-14px_rgba(23,23,37,0.18)] dark:shadow-none">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Atualizado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <div className="text-muted-foreground flex flex-col items-center gap-1 text-sm">
                        <Target className="size-5" />
                        Nenhum lead cadastrado ainda.
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  leads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/app/leads/${lead.id}`}
                          className="hover:underline"
                        >
                          {lead.name}
                        </Link>
                        {lead.email ? (
                          <div className="text-muted-foreground text-xs">
                            {lead.email}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {lead.company ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {lead.source?.name ?? "—"}
                      </TableCell>
                      <TableCell>
                        {lead.status ? (
                          <StatusPill
                            name={lead.status.name}
                            color={lead.status.color}
                          />
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {lead.assignee_name ?? "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {lead.value !== null
                          ? formatMoney(Number(lead.value))
                          : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(lead.updated_at)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  )
}

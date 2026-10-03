import Link from "next/link"
import { LifeBuoy } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  TicketPriorityBadge,
  TicketStatusBadge,
} from "@/components/app/ticket-bits"
import { TagFilter } from "@/components/app/tag-filter"
import { Pagination } from "@/components/app/pagination"
import { formatDate } from "@/lib/format"
import { getMemberships } from "@/lib/auth"
import { getActiveTenant } from "@/lib/tenant"
import { PAGE_SIZE, parsePage } from "@/lib/pagination"
import { listCompanies } from "@/server/queries/companies"
import { listProjects, listTenantMembers } from "@/server/queries/projects"
import { listDepartments, listTicketsPage } from "@/server/queries/tickets"
import { entityIdsByTag, listTags } from "@/server/queries/tags"
import { TicketFormDialog } from "./ticket-form-dialog"

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; page?: string }>
}) {
  const { tag, page: pageParam } = await searchParams
  const page = parsePage(pageParam)
  const memberships = await getMemberships()
  const active = await getActiveTenant(memberships)
  if (!active) return null

  const tagIds = tag
    ? await entityIdsByTag(active.tenantId, "ticket", tag)
    : undefined

  const [
    { rows: tickets, total },
    departments,
    companies,
    projects,
    members,
    tags,
  ] = await Promise.all([
    listTicketsPage(active.tenantId, {
      page,
      pageSize: PAGE_SIZE,
      ids: tagIds,
    }),
    listDepartments(active.tenantId),
    listCompanies(active.tenantId),
    listProjects(active.tenantId),
    listTenantMembers(active.tenantId),
    listTags(active.tenantId),
  ])

  const companyOptions = companies.map((c) => ({ id: c.id, name: c.name }))
  const projectOptions = projects.map((p) => ({ id: p.id, name: p.name }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Tickets</h1>
          <p className="text-muted-foreground text-sm">
            {total} ticket(s) · suporte e atendimento.
          </p>
        </div>
        <TicketFormDialog
          departments={departments}
          companies={companyOptions}
          projects={projectOptions}
          members={members}
          label="Novo ticket"
        />
      </div>

      <TagFilter
        tags={tags}
        active={tag}
        hrefFor={(tagId) =>
          tagId ? `/app/tickets?tag=${tagId}` : "/app/tickets"
        }
      />

      <div className="bg-card overflow-hidden rounded-2xl border shadow-[0_6px_24px_-14px_rgba(23,23,37,0.18)] dark:shadow-none">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Assunto</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Departamento</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Prioridade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Atualizado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  <div className="text-muted-foreground flex flex-col items-center gap-1 text-sm">
                    <LifeBuoy className="size-5" />
                    Nenhum ticket cadastrado ainda.
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              tickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/app/tickets/${ticket.id}`}
                      className="hover:underline"
                    >
                      {ticket.formatted_number}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-[260px] truncate">
                    {ticket.subject}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {ticket.company?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {ticket.department?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {ticket.assignee_name ?? "—"}
                  </TableCell>
                  <TableCell>
                    <TicketPriorityBadge priority={ticket.priority} />
                  </TableCell>
                  <TableCell>
                    <TicketStatusBadge status={ticket.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(ticket.updated_at)}
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
          if (tag) params.set("tag", tag)
          if (target > 1) params.set("page", String(target))
          const query = params.toString()
          return query ? `/app/tickets?${query}` : "/app/tickets"
        }}
      />
    </div>
  )
}

import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  TicketPriorityBadge,
  TicketStatusBadge,
  TicketTypeBadge,
} from "@/components/app/ticket-bits"
import { AttachmentsSection } from "@/components/app/attachments-section"
import { TICKET_STATUSES } from "@/lib/constants"
import { formatDate } from "@/lib/format"
import { getMemberships } from "@/lib/auth"
import { getActiveTenant } from "@/lib/tenant"
import { createClient } from "@/lib/supabase/server"
import { getCompany, listCompanies } from "@/server/queries/companies"
import { listProjects, listTenantMembers } from "@/server/queries/projects"
import {
  getTicket,
  listDepartments,
  listTicketReplies,
} from "@/server/queries/tickets"
import {
  addTicketReplyAction,
  updateTicketStatusAction,
} from "@/server/actions/tickets"
import { TicketFormDialog } from "../ticket-form-dialog"
import { DeleteTicketButton } from "../delete-ticket-button"
import { DeleteReplyButton } from "./delete-reply-button"

const fieldClass =
  "border-input bg-background dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3"

function DetailRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="space-y-1">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="text-sm">{value || "—"}</dd>
    </div>
  )
}

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const memberships = await getMemberships()
  const active = await getActiveTenant(memberships)
  if (!active) return null

  const ticket = await getTicket(active.tenantId, id)
  if (!ticket) notFound()

  const supabase = await createClient()
  const [replies, departments, companies, projects, members] =
    await Promise.all([
      listTicketReplies(active.tenantId, ticket.id),
      listDepartments(active.tenantId),
      listCompanies(active.tenantId),
      listProjects(active.tenantId),
      listTenantMembers(active.tenantId),
    ])

  const company = ticket.company_id
    ? await getCompany(active.tenantId, ticket.company_id)
    : null
  const departmentName =
    departments.find((d) => d.id === ticket.department_id)?.name ?? null
  const projectName =
    projects.find((p) => p.id === ticket.project_id)?.name ?? null
  const assigneeName =
    members.find((m) => m.user_id === ticket.assignee_id)?.full_name ?? null

  let contactName: string | null = null
  if (ticket.contact_id) {
    const { data: contact } = await supabase
      .from("contacts")
      .select("first_name, last_name")
      .eq("id", ticket.contact_id)
      .maybeSingle()
    if (contact) {
      contactName =
        `${contact.first_name} ${contact.last_name ?? ""}`.trim() || null
    }
  }

  const companyOptions = companies.map((c) => ({ id: c.id, name: c.name }))
  const projectOptions = projects.map((p) => ({ id: p.id, name: p.name }))

  return (
    <div className="space-y-6">
      <Link
        href="/app/tickets"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" />
        Tickets
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="text-muted-foreground text-xs">
            {ticket.formatted_number}
          </div>
          <h1 className="text-xl font-semibold tracking-tight">
            {ticket.subject}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <TicketStatusBadge status={ticket.status} />
            <TicketPriorityBadge priority={ticket.priority} />
            <TicketTypeBadge type={ticket.type} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TicketFormDialog
            ticket={ticket}
            departments={departments}
            companies={companyOptions}
            projects={projectOptions}
            members={members}
            label="Editar"
          />
          <DeleteTicketButton id={ticket.id} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Descrição</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                {ticket.details || "Sem descrição."}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Conversa ({replies.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {replies.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Nenhuma resposta ainda.
                </p>
              ) : (
                <ul className="space-y-3">
                  {replies.map((reply) => (
                    <li
                      key={reply.id}
                      className={
                        reply.is_internal
                          ? "rounded-lg border border-dashed bg-[#ffc542]/5 px-3 py-2"
                          : "rounded-lg border px-3 py-2"
                      }
                    >
                      <div className="text-muted-foreground mb-1 flex items-center justify-between text-xs">
                        <span>
                          <span className="text-foreground font-medium">
                            {reply.author_name ??
                              reply.contact_name ??
                              "Usuário"}
                          </span>{" "}
                          ·{" "}
                          {new Date(reply.created_at).toLocaleString("pt-BR", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                          {reply.is_internal ? " · nota interna" : ""}
                        </span>
                        <DeleteReplyButton id={reply.id} ticketId={ticket.id} />
                      </div>
                      <p className="text-sm whitespace-pre-wrap">
                        {reply.body}
                      </p>
                    </li>
                  ))}
                </ul>
              )}

              <form action={addTicketReplyAction} className="space-y-2">
                <input type="hidden" name="ticket_id" value={ticket.id} />
                <Textarea
                  name="body"
                  rows={3}
                  placeholder="Escreva uma resposta..."
                  required
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="is_internal"
                      className="accent-primary size-4"
                    />
                    Nota interna
                  </label>
                  <Button type="submit" size="sm">
                    Responder
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <AttachmentsSection
            tenantId={active.tenantId}
            entityType="ticket"
            entityId={ticket.id}
          />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Detalhes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <dl className="grid gap-3">
                <DetailRow label="Cliente" value={company?.name ?? null} />
                <DetailRow label="Contato" value={contactName} />
                <DetailRow label="Departamento" value={departmentName} />
                <DetailRow label="Responsável" value={assigneeName} />
                <DetailRow label="Projeto" value={projectName} />
                <DetailRow
                  label="Aberto em"
                  value={formatDate(ticket.created_at)}
                />
                <DetailRow
                  label="Fechado em"
                  value={formatDate(ticket.closed_at)}
                />
              </dl>
            </CardContent>
          </Card>

          <form
            action={updateTicketStatusAction}
            className="flex items-end gap-2"
          >
            <input type="hidden" name="id" value={ticket.id} />
            <select
              name="status"
              defaultValue={String(ticket.status)}
              className={fieldClass}
            >
              {Object.entries(TICKET_STATUSES).map(([value, config]) => (
                <option key={value} value={value}>
                  {config.label}
                </option>
              ))}
            </select>
            <Button type="submit" variant="outline" size="sm">
              Atualizar
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

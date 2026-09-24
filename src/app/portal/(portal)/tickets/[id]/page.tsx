import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, FileText } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  TicketPriorityBadge,
  TicketStatusBadge,
} from "@/components/app/ticket-bits"
import { formatDate } from "@/lib/format"
import {
  getPortalContact,
  getPortalTicket,
  listPortalTicketReplies,
} from "@/server/queries/portal"
import { listAttachments } from "@/server/queries/attachments"
import { addPortalTicketReplyAction } from "@/server/actions/portal"

export default async function PortalTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const contact = await getPortalContact()
  if (!contact) return null

  const ticket = await getPortalTicket(id)
  if (!ticket) notFound()

  const [replies, attachments] = await Promise.all([
    listPortalTicketReplies(ticket.id),
    listAttachments(contact.tenant_id, "ticket", ticket.id),
  ])

  return (
    <div className="space-y-6">
      <Link
        href="/portal/tickets"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" />
        Tickets
      </Link>

      <div className="space-y-2">
        <div className="text-muted-foreground text-xs">
          {ticket.formatted_number}
        </div>
        <h1 className="font-heading text-xl font-semibold tracking-tight">
          {ticket.subject}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <TicketStatusBadge status={ticket.status} />
          <TicketPriorityBadge priority={ticket.priority} />
          <span className="text-muted-foreground text-xs">
            Aberto em {formatDate(ticket.created_at)}
          </span>
        </div>
      </div>

      {ticket.details ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Descrição</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm whitespace-pre-wrap">
              {ticket.details}
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conversa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {replies.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Nenhuma mensagem ainda.
            </p>
          ) : (
            <ul className="space-y-3">
              {replies.map((reply) => (
                <li
                  key={reply.id}
                  className={
                    reply.from_client
                      ? "bg-primary/5 rounded-lg border px-3 py-2"
                      : "bg-muted/40 rounded-lg border px-3 py-2"
                  }
                >
                  <div className="text-muted-foreground mb-1 flex items-center justify-between text-xs">
                    <span className="text-foreground font-medium">
                      {reply.from_client ? "Você" : "Equipe de suporte"}
                    </span>
                    <span>
                      {new Date(reply.created_at).toLocaleString("pt-BR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{reply.body}</p>
                </li>
              ))}
            </ul>
          )}

          <form action={addPortalTicketReplyAction} className="space-y-2">
            <input type="hidden" name="ticket_id" value={ticket.id} />
            <Textarea
              name="body"
              rows={3}
              placeholder="Escreva uma mensagem..."
              required
            />
            <div className="flex justify-end">
              <Button type="submit" size="sm">
                Enviar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {attachments.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Arquivos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {attachments.map((file) => (
              <a
                key={file.id}
                href={file.url ?? "#"}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-sm hover:underline"
              >
                <FileText className="text-muted-foreground size-4" />
                {file.file_name}
              </a>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}

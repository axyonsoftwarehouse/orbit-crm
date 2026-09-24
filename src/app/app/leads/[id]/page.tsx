import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { StatusPill } from "@/components/app/status-pill"
import { Badge } from "@/components/ui/badge"
import { formatDate, formatMoney } from "@/lib/format"
import { getMemberships } from "@/lib/auth"
import { getActiveTenant } from "@/lib/tenant"
import { listTenantMembers } from "@/server/queries/projects"
import {
  getLead,
  listLeadActivities,
  listLeadSources,
  listLeadStatuses,
} from "@/server/queries/leads"
import { addLeadActivityAction } from "@/server/actions/leads"
import { LeadFormDialog } from "../lead-form-dialog"
import { LeadStatusSelect } from "../lead-status-select"
import { ConvertLeadButton, DeleteLeadButton } from "./lead-actions"

function DetailRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="space-y-1">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="text-sm">{value || "—"}</dd>
    </div>
  )
}

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const memberships = await getMemberships()
  const active = await getActiveTenant(memberships)
  if (!active) return null

  const lead = await getLead(active.tenantId, id)
  if (!lead) notFound()

  const [statuses, sources, members, activities] = await Promise.all([
    listLeadStatuses(active.tenantId),
    listLeadSources(active.tenantId),
    listTenantMembers(active.tenantId),
    listLeadActivities(active.tenantId, lead.id),
  ])

  const status = statuses.find((s) => s.id === lead.status_id) ?? null
  const source = sources.find((s) => s.id === lead.source_id) ?? null
  const assignee =
    members.find((m) => m.user_id === lead.assignee_id)?.full_name ?? null

  return (
    <div className="space-y-6">
      <Link
        href="/app/leads"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" />
        Leads
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-xl font-semibold tracking-tight">{lead.name}</h1>
          <div className="flex flex-wrap items-center gap-2">
            {status ? (
              <StatusPill name={status.name} color={status.color} />
            ) : null}
            {lead.converted_company_id ? (
              <Badge variant="secondary">Convertido</Badge>
            ) : null}
            {lead.lost ? <Badge variant="secondary">Perdido</Badge> : null}
            {lead.value !== null ? (
              <span className="text-muted-foreground text-sm">
                {formatMoney(Number(lead.value))}
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {lead.converted_company_id ? (
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={
                <Link href={`/app/clientes/${lead.converted_company_id}`} />
              }
            >
              Ver cliente
            </Button>
          ) : (
            <ConvertLeadButton id={lead.id} />
          )}
          <LeadFormDialog
            lead={lead}
            statuses={statuses}
            sources={sources}
            members={members}
            label="Editar"
          />
          <DeleteLeadButton id={lead.id} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {lead.description ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Descrição</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                  {lead.description}
                </p>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Atividades ({activities.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {activities.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Nenhuma atividade ainda.
                </p>
              ) : (
                <ul className="space-y-3">
                  {activities.map((activity) => (
                    <li
                      key={activity.id}
                      className="rounded-lg border px-3 py-2 text-sm"
                    >
                      <div className="text-muted-foreground mb-1 flex items-center justify-between text-xs">
                        <span className="text-foreground font-medium">
                          {activity.author_name ?? "Sistema"}
                        </span>
                        <span>
                          {new Date(activity.created_at).toLocaleString(
                            "pt-BR",
                            { dateStyle: "short", timeStyle: "short" },
                          )}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap">
                        {activity.description}
                      </p>
                    </li>
                  ))}
                </ul>
              )}

              <form action={addLeadActivityAction} className="space-y-2">
                <input type="hidden" name="lead_id" value={lead.id} />
                <Textarea
                  name="description"
                  rows={2}
                  placeholder="Registrar uma interação..."
                  required
                />
                <div className="flex justify-end">
                  <Button type="submit" size="sm">
                    Adicionar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dados</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3">
                <DetailRow label="Empresa" value={lead.company} />
                <DetailRow label="Cargo" value={lead.title} />
                <DetailRow label="E-mail" value={lead.email} />
                <DetailRow label="Telefone" value={lead.phone} />
                <DetailRow label="Site" value={lead.website} />
                <DetailRow label="Origem" value={source?.name ?? null} />
                <DetailRow label="Responsável" value={assignee} />
                <DetailRow
                  label="Local"
                  value={
                    [lead.city, lead.state, lead.country]
                      .filter(Boolean)
                      .join(", ") || null
                  }
                />
                <DetailRow
                  label="Criado em"
                  value={formatDate(lead.created_at)}
                />
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <LeadStatusSelect
                id={lead.id}
                statusId={lead.status_id}
                statuses={statuses}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

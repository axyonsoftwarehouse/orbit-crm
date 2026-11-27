import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, CalendarClock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusPill } from "@/components/app/status-pill"
import { TagPicker } from "@/components/app/tag-picker"
import { ContactShortcuts } from "@/components/app/contact-shortcuts"
import { CustomFieldsCard } from "@/components/app/custom-fields-view"
import { Badge } from "@/components/ui/badge"
import { formatDate, formatDateTime, formatMoney } from "@/lib/format"
import { getMemberships } from "@/lib/auth"
import { getActiveTenant } from "@/lib/tenant"
import { isAiConfigured } from "@/server/ai/model"
import { EntityAssistant } from "@/components/app/assistant/entity-assistant"
import { listTenantMembers } from "@/server/queries/projects"
import {
  getLead,
  listLeadActivities,
  listLeadSources,
  listLeadStatuses,
} from "@/server/queries/leads"
import { listTags, tagsForEntity } from "@/server/queries/tags"
import {
  customFieldValuesForEntity,
  listCustomFieldDefinitions,
} from "@/server/queries/custom-fields"
import { completeLeadNextStepAction } from "@/server/actions/leads"
import {
  formatNextStep,
  isNextStepOverdue,
  leadActivityTypeLabel,
} from "@/lib/lead-activity"
import { cn } from "@/lib/utils"
import { LeadFormDialog } from "../lead-form-dialog"
import { LeadStatusSelect } from "../lead-status-select"
import { ConvertLeadButton, DeleteLeadButton } from "./lead-actions"
import { LeadActivityForm } from "./lead-activity-form"

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

  const [entityTags, allTags, customFields, customValues] = await Promise.all([
    tagsForEntity(active.tenantId, "lead", lead.id),
    listTags(active.tenantId),
    listCustomFieldDefinitions(active.tenantId, "lead"),
    customFieldValuesForEntity(active.tenantId, "lead", lead.id),
  ])

  const status = statuses.find((s) => s.id === lead.status_id) ?? null
  const source = sources.find((s) => s.id === lead.source_id) ?? null
  const assignee =
    members.find((m) => m.user_id === lead.assignee_id)?.full_name ?? null
  const openNextStep =
    activities.find((a) => a.next_step_at && !a.next_step_done_at) ?? null

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
          <ContactShortcuts
            email={lead.email}
            phone={lead.phone}
            name={lead.name}
          />
          <TagPicker
            entityType="lead"
            entityId={lead.id}
            assigned={entityTags}
            all={allTags}
          />
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
            customFields={customFields}
            customValues={customValues}
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
                      <div className="text-muted-foreground mb-1 flex items-center justify-between gap-2 text-xs">
                        <span className="flex items-center gap-2">
                          <Badge variant="outline">
                            {leadActivityTypeLabel(activity.type)}
                          </Badge>
                          <span className="text-foreground font-medium">
                            {activity.author_name ?? "Sistema"}
                          </span>
                        </span>
                        <span>{formatDateTime(activity.created_at)}</span>
                      </div>
                      <p className="whitespace-pre-wrap">
                        {activity.description}
                      </p>
                      {activity.next_step_at ? (
                        <p
                          className={cn(
                            "text-muted-foreground mt-1 flex items-center gap-1.5 text-xs",
                            activity.next_step_done_at && "line-through",
                          )}
                        >
                          <CalendarClock className="size-3.5" />
                          Próximo passo: {formatNextStep(activity.next_step_at)}
                          {activity.next_step_note
                            ? ` · ${activity.next_step_note}`
                            : null}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}

              <LeadActivityForm leadId={lead.id} />
            </CardContent>
          </Card>

          <EntityAssistant
            api="/api/ai/lead"
            body={{ leadId: lead.id }}
            enabled={isAiConfigured()}
            intro="Peça um resumo da negociação, o próximo passo recomendado ou um e-mail de follow-up."
            placeholder="Ex.: escreva um follow-up para este lead"
          />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarClock className="size-4" />
                Próximo passo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {openNextStep?.next_step_at ? (
                <>
                  <div>
                    <p
                      className={cn(
                        "font-medium",
                        isNextStepOverdue(openNextStep.next_step_at) &&
                          "text-destructive",
                      )}
                    >
                      {formatNextStep(openNextStep.next_step_at)}
                    </p>
                    <p className="text-muted-foreground">
                      {openNextStep.next_step_note ?? "Sem descrição"}
                    </p>
                  </div>
                  <form action={completeLeadNextStepAction}>
                    <input type="hidden" name="id" value={openNextStep.id} />
                    <input type="hidden" name="lead_id" value={lead.id} />
                    <Button type="submit" variant="outline" size="sm">
                      Marcar como feito
                    </Button>
                  </form>
                </>
              ) : (
                <p className="text-muted-foreground">
                  Nenhum agendado. Registre uma atividade com o próximo passo.
                </p>
              )}
            </CardContent>
          </Card>

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

          <CustomFieldsCard fields={customFields} values={customValues} />
        </div>
      </div>
    </div>
  )
}

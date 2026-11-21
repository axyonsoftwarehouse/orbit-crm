import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  ContractSignatureBadge,
  ContractStatusBadge,
} from "@/components/app/contract-bits"
import { formatDate, formatDateTime, formatMoney } from "@/lib/format"
import { getMemberships } from "@/lib/auth"
import { getActiveTenant } from "@/lib/tenant"
import { listContacts, listCompanies } from "@/server/queries/companies"
import { getContract, listContractEvents } from "@/server/queries/contracts"
import { ContractFormDialog } from "../contract-form-dialog"
import { SendContractDialog } from "./send-contract-dialog"
import { ContractSignatureActions } from "./contract-signature-actions"

const EVENT_LABEL: Record<string, string> = {
  created: "Criado",
  sent: "Enviado para assinatura",
  viewed: "Visualizado pelo cliente",
  signed: "Assinado pelo cliente",
  unsigned: "Assinatura desfeita",
  marked_signed: "Marcado como assinado no papel",
  reminder: "Lembrete enviado",
}

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const memberships = await getMemberships()
  const active = await getActiveTenant(memberships)
  if (!active) return null

  const contract = await getContract(active.tenantId, id)
  if (!contract) notFound()

  const [events, contacts, companies] = await Promise.all([
    listContractEvents(active.tenantId, id),
    contract.company_id
      ? listContacts(active.tenantId, contract.company_id)
      : Promise.resolve([]),
    listCompanies(active.tenantId),
  ])

  const signed = Boolean(contract.signed_at)
  const markedAsSigned = Boolean(contract.marked_as_signed_at)
  const canManage = active.role !== "member"

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={<Link href="/app/contratos" />}
            className="-ml-2"
          >
            <ArrowLeft className="size-4" />
            Contratos
          </Button>
          <h1 className="text-xl font-semibold tracking-tight">
            {contract.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <ContractStatusBadge
              status={contract.status}
              endDate={contract.end_date}
            />
            <ContractSignatureBadge
              signedAt={contract.signed_at}
              markedAsSignedAt={contract.marked_as_signed_at}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {!signed ? (
            <SendContractDialog
              contractId={contract.id}
              contacts={contacts.map((contact) => ({
                id: contact.id,
                name: [contact.first_name, contact.last_name]
                  .filter(Boolean)
                  .join(" "),
                email: contact.email,
                isPrimary: contact.is_primary,
              }))}
            />
          ) : null}
          <ContractFormDialog
            contract={contract}
            companies={companies.map((company) => ({
              id: company.id,
              name: company.name,
            }))}
            label="Editar"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
        <section className="bg-card space-y-4 rounded-2xl border p-5">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground text-xs uppercase">
                Cliente
              </dt>
              <dd>{contract.company?.name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs uppercase">Valor</dt>
              <dd>
                {contract.value === null ? "—" : formatMoney(contract.value)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs uppercase">
                Início
              </dt>
              <dd>{formatDate(contract.start_date)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs uppercase">
                Término
              </dt>
              <dd>{formatDate(contract.end_date)}</dd>
            </div>
          </dl>

          <div className="space-y-2">
            <h2 className="text-sm font-semibold">Conteúdo</h2>
            <div className="bg-muted/40 rounded-xl border p-4 text-sm leading-relaxed whitespace-pre-wrap">
              {contract.content?.trim() ||
                contract.description?.trim() ||
                "Sem conteúdo cadastrado. Edite o contrato para incluir o texto e os placeholders ({{cliente.nome}}, {{contrato.valor}}, {{data.hoje}})."}
            </div>
          </div>

          {signed ? (
            <div className="rounded-xl border border-green-600/30 bg-green-600/10 p-4 text-sm">
              <p className="font-semibold">
                Assinado em {formatDateTime(contract.signed_at)}
              </p>
              {contract.content_hash ? (
                <p className="text-muted-foreground mt-1 font-mono text-xs">
                  SHA-256 {contract.content_hash.slice(0, 24)}…
                </p>
              ) : null}
            </div>
          ) : null}
        </section>

        <aside className="space-y-4">
          {canManage ? (
            <div className="bg-card space-y-3 rounded-2xl border p-5">
              <h2 className="text-sm font-semibold">Assinatura</h2>
              <ContractSignatureActions
                contractId={contract.id}
                signed={signed}
                markedAsSigned={markedAsSigned}
              />
              <p className="text-muted-foreground text-xs">
                O link de assinatura é enviado por e-mail. Manifestação do
                cliente fica registrada com nome, e-mail, data, IP e hash do
                conteúdo.
              </p>
            </div>
          ) : null}

          <div className="bg-card space-y-3 rounded-2xl border p-5">
            <h2 className="text-sm font-semibold">Histórico</h2>
            {events.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Nenhum evento ainda.
              </p>
            ) : (
              <ol className="space-y-3 text-sm">
                {events.map((event) => (
                  <li key={event.id} className="border-muted border-l-2 pl-3">
                    <p className="font-medium">
                      {EVENT_LABEL[event.kind] ?? event.kind}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {formatDateTime(event.created_at)}
                      {event.actor_kind === "client" ? " · cliente" : ""}
                      {event.ip ? ` · ${event.ip}` : ""}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}

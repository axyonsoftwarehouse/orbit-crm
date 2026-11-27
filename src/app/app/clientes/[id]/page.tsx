import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Clock, FolderKanban, HandCoins, Wallet } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TagPicker } from "@/components/app/tag-picker"
import { ContactShortcuts } from "@/components/app/contact-shortcuts"
import { CustomFieldsCard } from "@/components/app/custom-fields-view"
import { getMemberships, getUser } from "@/lib/auth"
import { ClientAssistant } from "@/components/app/assistant/client-assistant"
import { isAiConfigured } from "@/server/ai/model"
import { listTeamMembers } from "@/server/queries/team"
import { getActiveTenant } from "@/lib/tenant"
import { getCompany, listContacts } from "@/server/queries/companies"
import { isManager } from "@/server/permissions"
import { listTags, tagsForEntity } from "@/server/queries/tags"
import {
  customFieldValuesForEntity,
  listCustomFieldDefinitions,
} from "@/server/queries/custom-fields"
import { CompanyFormDialog } from "../company-form-dialog"
import { DeleteCompanyButton } from "../delete-company-button"
import { ContactFormDialog } from "./contact-form-dialog"
import { DeleteContactButton } from "./delete-contact-button"
import { InvitePortalDialog } from "./invite-portal-dialog"
import { StatCard } from "@/components/app/stat-card"
import { formatMoney } from "@/lib/format"
import { formatHours } from "@/lib/client-360"
import { getClient360 } from "@/server/queries/client-360"
import {
  ClientTabsNav,
  ContractsSection,
  EstimatesSection,
  InvoicesSection,
  ProjectsSection,
  SocialSection,
  TicketsSection,
  TimelineSection,
  parseClientTab,
} from "./client-360-sections"

function DetailRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="space-y-1">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="text-sm">{value || "—"}</dd>
    </div>
  )
}

export default async function CompanyDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ aba?: string }>
}) {
  const { id } = await params
  const tab = parseClientTab((await searchParams).aba)
  const memberships = await getMemberships()
  const active = await getActiveTenant(memberships)
  if (!active) return null

  const company = await getCompany(active.tenantId, id)
  if (!company) notFound()

  const [
    contacts,
    entityTags,
    allTags,
    customFields,
    customValues,
    user,
    teamMembers,
    client360,
  ] = await Promise.all([
    listContacts(active.tenantId, company.id),
    tagsForEntity(active.tenantId, "company", company.id),
    listTags(active.tenantId),
    listCustomFieldDefinitions(active.tenantId, "company"),
    customFieldValuesForEntity(active.tenantId, "company", company.id),
    getUser(),
    listTeamMembers(active.tenantId),
    getClient360(active.tenantId, company.id),
  ])

  const primaryContact =
    contacts.find((contact) => contact.is_primary) ?? contacts[0] ?? null
  const activeProjects = client360.projects.filter(
    (project) => project.status === 1 || project.status === 2,
  ).length
  const { finance } = client360

  return (
    <div className="space-y-6">
      <Link
        href="/app/clientes"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" />
        Clientes
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-xl font-semibold tracking-tight">
            {company.name}
          </h1>
          <p className="text-muted-foreground text-sm">
            {[company.city, company.country].filter(Boolean).join(", ") ||
              "Cliente"}
          </p>
          <ContactShortcuts
            email={primaryContact?.email}
            phone={company.phone ?? primaryContact?.phone}
            name={company.name}
          />
          <TagPicker
            entityType="company"
            entityId={company.id}
            assigned={entityTags}
            all={allTags}
          />
        </div>
        <div className="flex items-center gap-2">
          <CompanyFormDialog
            company={company}
            customFields={customFields}
            customValues={customValues}
            label="Editar"
          />
          {isManager(active.role) && <DeleteCompanyButton id={company.id} />}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={
            finance.overdueCount > 0
              ? `A receber · ${finance.overdueCount} vencida(s)`
              : "A receber"
          }
          value={formatMoney(finance.receivable)}
          icon={Wallet}
          tone={finance.overdueCount > 0 ? "red" : "yellow"}
        />
        <StatCard
          label="Recebido"
          value={formatMoney(finance.received)}
          icon={HandCoins}
          tone="green"
        />
        <StatCard
          label="Horas registradas"
          value={formatHours(client360.hours)}
          icon={Clock}
          tone="blue"
        />
        <StatCard
          label="Projetos ativos"
          value={String(activeProjects)}
          icon={FolderKanban}
        />
      </div>

      <ClientTabsNav
        companyId={company.id}
        active={tab}
        tabs={[
          { key: "geral", label: "Visão geral" },
          {
            key: "projetos",
            label: "Projetos",
            count: client360.projects.length,
          },
          {
            key: "financeiro",
            label: "Financeiro",
            count: client360.estimates.length + client360.invoices.length,
          },
          {
            key: "contratos",
            label: "Contratos",
            count: client360.contracts.length,
          },
          {
            key: "tickets",
            label: "Tickets",
            count: client360.tickets.length,
          },
          {
            key: "social",
            label: "Social",
            count: client360.socialPosts.length,
          },
          { key: "atividades", label: "Linha do tempo" },
        ]}
      />

      {tab === "geral" && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dados do cliente</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-3">
                <DetailRow label="CNPJ" value={company.vat} />
                <DetailRow label="Telefone" value={company.phone} />
                <DetailRow label="Site" value={company.website} />
                <DetailRow label="Endereço" value={company.address} />
                <DetailRow label="Cidade" value={company.city} />
                <DetailRow label="Estado" value={company.state} />
                <DetailRow label="CEP" value={company.zip} />
                <DetailRow label="País" value={company.country} />
                <DetailRow label="Observações" value={company.notes} />
              </dl>
            </CardContent>
          </Card>

          <CustomFieldsCard fields={customFields} values={customValues} />

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">Contatos</CardTitle>
              <ContactFormDialog companyId={company.id} label="Novo contato" />
            </CardHeader>
            <CardContent className="px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead className="w-0" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-muted-foreground h-20 text-center text-sm"
                      >
                        Nenhum contato cadastrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    contacts.map((contact) => (
                      <TableRow key={contact.id}>
                        <TableCell className="font-medium">
                          <span className="inline-flex items-center gap-2">
                            {contact.first_name} {contact.last_name}
                            {contact.is_primary ? (
                              <Badge variant="secondary">Principal</Badge>
                            ) : null}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {contact.email ?? "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {contact.phone ?? "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {contact.title ?? "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <ContactShortcuts
                              email={contact.email}
                              phone={contact.phone}
                              name={`${contact.first_name} ${contact.last_name ?? ""}`.trim()}
                              variant="icon"
                            />
                            <InvitePortalDialog
                              contactId={contact.id}
                              companyId={company.id}
                              contactName={`${contact.first_name} ${contact.last_name ?? ""}`.trim()}
                              hasEmail={Boolean(contact.email)}
                              alreadyActive={Boolean(contact.user_id)}
                            />
                            <ContactFormDialog
                              companyId={company.id}
                              contact={contact}
                              label="Editar"
                            />
                            <DeleteContactButton
                              id={contact.id}
                              companyId={company.id}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
      {tab === "projetos" && <ProjectsSection projects={client360.projects} />}
      {tab === "financeiro" && (
        <>
          <InvoicesSection invoices={client360.invoices} />
          <EstimatesSection estimates={client360.estimates} />
        </>
      )}
      {tab === "contratos" && (
        <ContractsSection contracts={client360.contracts} />
      )}
      {tab === "tickets" && <TicketsSection tickets={client360.tickets} />}
      {tab === "social" && <SocialSection posts={client360.socialPosts} />}
      {tab === "atividades" && <TimelineSection items={client360.timeline} />}

      {user && (
        <ClientAssistant
          companyId={company.id}
          enabled={isAiConfigured()}
          projects={client360.projects
            .map((project) => ({ id: project.id, name: project.name }))
            .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))}
          members={teamMembers.map((member) => ({
            user_id: member.user_id,
            label: member.full_name || member.email || "Membro",
          }))}
          currentUserId={user.id}
        />
      )}
    </div>
  )
}

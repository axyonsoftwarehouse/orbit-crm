import Link from "next/link"
import type { ReactNode } from "react"
import { ArrowRightLeft, History, StickyNote } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { formatDate, formatDateTime, formatMoney } from "@/lib/format"
import {
  EstimateStatusBadge,
  InvoiceStatusBadge,
} from "@/components/app/document-status-badge"
import { ProgressBar, ProjectStatusBadge } from "@/components/app/project-bits"
import {
  ContractSignatureBadge,
  ContractStatusBadge,
} from "@/components/app/contract-bits"
import {
  TicketPriorityBadge,
  TicketStatusBadge,
} from "@/components/app/ticket-bits"
import { SocialStatusBadge } from "@/components/app/social-bits"
import type { TimelineItem } from "@/lib/client-360"
import type {
  Client360Contract,
  Client360Document,
  Client360Project,
  Client360SocialPost,
  Client360Ticket,
} from "@/server/queries/client-360"

export const CLIENT_TABS = [
  "geral",
  "projetos",
  "financeiro",
  "contratos",
  "tickets",
  "social",
  "atividades",
] as const

export type ClientTab = (typeof CLIENT_TABS)[number]

export function parseClientTab(value: string | undefined): ClientTab {
  return CLIENT_TABS.includes(value as ClientTab)
    ? (value as ClientTab)
    : "geral"
}

export function ClientTabsNav({
  companyId,
  active,
  tabs,
}: {
  companyId: string
  active: ClientTab
  tabs: { key: ClientTab; label: string; count?: number }[]
}) {
  return (
    <nav
      aria-label="Seções do cliente"
      className="-mx-1 flex [scrollbar-width:thin] gap-1 overflow-x-auto overflow-y-hidden border-b px-1 [contain:inline-size]"
    >
      {tabs.map((tab) => {
        const isActive = tab.key === active
        const href =
          tab.key === "geral"
            ? `/app/clientes/${companyId}`
            : `/app/clientes/${companyId}?aba=${tab.key}`
        return (
          <Link
            key={tab.key}
            href={href}
            scroll={false}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "-mb-px inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-sm whitespace-nowrap transition-colors",
              isActive
                ? "border-primary text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground border-transparent",
            )}
          >
            {tab.label}
            {tab.count !== undefined ? (
              <span className="bg-muted text-muted-foreground rounded-full px-1.5 text-xs">
                {tab.count}
              </span>
            ) : null}
          </Link>
        )
      })}
    </nav>
  )
}

function ListCard({
  title,
  action,
  headers,
  empty,
  children,
  isEmpty,
}: {
  title: string
  action?: ReactNode
  headers: string[]
  empty: string
  children: ReactNode
  isEmpty: boolean
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-base">{title}</CardTitle>
        {action}
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((header) => (
                <TableHead key={header}>{header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isEmpty ? (
              <TableRow>
                <TableCell
                  colSpan={headers.length}
                  className="text-muted-foreground h-20 text-center text-sm"
                >
                  {empty}
                </TableCell>
              </TableRow>
            ) : (
              children
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function NewLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="text-primary text-sm hover:underline">
      {label}
    </Link>
  )
}

function RowLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="font-medium hover:underline">
      {children}
    </Link>
  )
}

export function ProjectsSection({
  projects,
}: {
  projects: Client360Project[]
}) {
  return (
    <ListCard
      title="Projetos"
      action={<NewLink href="/app/projetos" label="Ver todos" />}
      headers={["Projeto", "Situação", "Progresso", "Prazo"]}
      empty="Nenhum projeto para este cliente."
      isEmpty={projects.length === 0}
    >
      {projects.map((project) => (
        <TableRow key={project.id}>
          <TableCell>
            <RowLink href={`/app/projetos/${project.id}`}>
              {project.name}
            </RowLink>
          </TableCell>
          <TableCell>
            <ProjectStatusBadge status={project.status} />
          </TableCell>
          <TableCell>
            <ProgressBar value={project.progress} />
          </TableCell>
          <TableCell className="text-muted-foreground">
            {formatDate(project.deadline)}
          </TableCell>
        </TableRow>
      ))}
    </ListCard>
  )
}

export function EstimatesSection({
  estimates,
}: {
  estimates: Client360Document[]
}) {
  return (
    <ListCard
      title="Orçamentos"
      action={<NewLink href="/app/orcamentos" label="Ver todos" />}
      headers={["Número", "Situação", "Data", "Validade", "Total"]}
      empty="Nenhum orçamento para este cliente."
      isEmpty={estimates.length === 0}
    >
      {estimates.map((estimate) => (
        <TableRow key={estimate.id}>
          <TableCell>
            <RowLink href={`/app/orcamentos/${estimate.id}`}>
              {estimate.formatted_number}
            </RowLink>
          </TableCell>
          <TableCell>
            <EstimateStatusBadge status={estimate.status} />
          </TableCell>
          <TableCell className="text-muted-foreground">
            {formatDate(estimate.date)}
          </TableCell>
          <TableCell className="text-muted-foreground">
            {formatDate(estimate.expiry_date)}
          </TableCell>
          <TableCell>
            {formatMoney(estimate.total, estimate.currency)}
          </TableCell>
        </TableRow>
      ))}
    </ListCard>
  )
}

export function InvoicesSection({
  invoices,
}: {
  invoices: Client360Document[]
}) {
  return (
    <ListCard
      title="Faturas"
      action={<NewLink href="/app/faturas" label="Ver todas" />}
      headers={["Número", "Situação", "Data", "Vencimento", "Total"]}
      empty="Nenhuma fatura para este cliente."
      isEmpty={invoices.length === 0}
    >
      {invoices.map((invoice) => (
        <TableRow key={invoice.id}>
          <TableCell>
            <RowLink href={`/app/faturas/${invoice.id}`}>
              {invoice.formatted_number}
            </RowLink>
          </TableCell>
          <TableCell>
            <InvoiceStatusBadge
              status={invoice.status}
              dueDate={invoice.due_date}
            />
          </TableCell>
          <TableCell className="text-muted-foreground">
            {formatDate(invoice.date)}
          </TableCell>
          <TableCell className="text-muted-foreground">
            {formatDate(invoice.due_date)}
          </TableCell>
          <TableCell>{formatMoney(invoice.total, invoice.currency)}</TableCell>
        </TableRow>
      ))}
    </ListCard>
  )
}

export function ContractsSection({
  contracts,
}: {
  contracts: Client360Contract[]
}) {
  return (
    <ListCard
      title="Contratos"
      action={<NewLink href="/app/contratos" label="Ver todos" />}
      headers={["Contrato", "Situação", "Assinatura", "Vigência", "Valor"]}
      empty="Nenhum contrato para este cliente."
      isEmpty={contracts.length === 0}
    >
      {contracts.map((contract) => (
        <TableRow key={contract.id}>
          <TableCell>
            <RowLink href={`/app/contratos/${contract.id}`}>
              {contract.title}
            </RowLink>
          </TableCell>
          <TableCell>
            <ContractStatusBadge
              status={contract.status}
              endDate={contract.end_date}
            />
          </TableCell>
          <TableCell>
            <ContractSignatureBadge
              signedAt={contract.signed_at}
              markedAsSignedAt={contract.marked_as_signed_at}
            />
          </TableCell>
          <TableCell className="text-muted-foreground">
            {formatDate(contract.start_date)} – {formatDate(contract.end_date)}
          </TableCell>
          <TableCell>{formatMoney(contract.value)}</TableCell>
        </TableRow>
      ))}
    </ListCard>
  )
}

export function TicketsSection({ tickets }: { tickets: Client360Ticket[] }) {
  return (
    <ListCard
      title="Tickets"
      action={<NewLink href="/app/tickets" label="Ver todos" />}
      headers={["Número", "Assunto", "Situação", "Prioridade", "Aberto em"]}
      empty="Nenhum ticket deste cliente."
      isEmpty={tickets.length === 0}
    >
      {tickets.map((ticket) => (
        <TableRow key={ticket.id}>
          <TableCell>
            <RowLink href={`/app/tickets/${ticket.id}`}>
              {ticket.formatted_number}
            </RowLink>
          </TableCell>
          <TableCell className="max-w-72 truncate">{ticket.subject}</TableCell>
          <TableCell>
            <TicketStatusBadge status={ticket.status} />
          </TableCell>
          <TableCell>
            <TicketPriorityBadge priority={ticket.priority} />
          </TableCell>
          <TableCell className="text-muted-foreground">
            {formatDate(ticket.created_at)}
          </TableCell>
        </TableRow>
      ))}
    </ListCard>
  )
}

export function SocialSection({ posts }: { posts: Client360SocialPost[] }) {
  return (
    <ListCard
      title="Posts do Social"
      action={<NewLink href="/app/social" label="Ver todos" />}
      headers={["Post", "Situação", "Agendado", "Publicado"]}
      empty="Nenhum post para este cliente."
      isEmpty={posts.length === 0}
    >
      {posts.map((post) => (
        <TableRow key={post.id}>
          <TableCell className="max-w-80">
            <Link
              href={`/app/social/${post.id}`}
              className="line-clamp-1 font-medium hover:underline"
            >
              {post.content || "(sem texto)"}
            </Link>
          </TableCell>
          <TableCell>
            <SocialStatusBadge status={post.status} />
          </TableCell>
          <TableCell className="text-muted-foreground">
            {formatDateTime(post.scheduled_at)}
          </TableCell>
          <TableCell className="text-muted-foreground">
            {formatDateTime(post.published_at)}
          </TableCell>
        </TableRow>
      ))}
    </ListCard>
  )
}

const TIMELINE_ICONS = {
  note: StickyNote,
  audit: History,
  conversion: ArrowRightLeft,
} as const

export function TimelineSection({ items }: { items: TimelineItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Linha do tempo</CardTitle>
        <p className="text-muted-foreground text-sm">
          Anotações do lead que originou o cliente e o que aconteceu nos
          documentos dele, do mais recente para o mais antigo.
        </p>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">
            Nenhuma atividade registrada ainda.
          </p>
        ) : (
          <ol className="space-y-4">
            {items.map((item) => {
              const Icon = TIMELINE_ICONS[item.kind]
              return (
                <li key={item.id} className="flex gap-3">
                  <div
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-full",
                      item.kind === "note"
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p
                      className={cn(
                        "text-sm break-words",
                        item.kind === "note" && "whitespace-pre-line",
                      )}
                    >
                      {item.href ? (
                        <Link href={item.href} className="hover:underline">
                          {item.text}
                        </Link>
                      ) : (
                        item.text
                      )}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {formatDateTime(item.at)}
                      {item.author ? ` · ${item.author}` : ""}
                      {item.kind === "note" ? " · anotação do lead" : ""}
                    </p>
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}

import Link from "next/link"
import { FileSignature } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Pagination } from "@/components/app/pagination"
import { ContractStatusBadge } from "@/components/app/contract-bits"
import { formatDate, formatMoney } from "@/lib/format"
import { getMemberships } from "@/lib/auth"
import { getActiveTenant } from "@/lib/tenant"
import { PAGE_SIZE, parsePage } from "@/lib/pagination"
import { CONTRACT_STATUSES } from "@/lib/constants"
import { listCompanies } from "@/server/queries/companies"
import { listContractsPage } from "@/server/queries/contracts"
import { ContractFormDialog } from "./contract-form-dialog"
import { DeleteContractButton } from "./delete-contract-button"

const fieldClass =
  "border-input bg-background dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 h-8 rounded-lg border px-2 text-sm outline-none focus-visible:ring-3"

export default async function ContratosPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; company?: string; status?: string }>
}) {
  const { page: pageParam, company, status } = await searchParams
  const page = parsePage(pageParam)
  const memberships = await getMemberships()
  const active = await getActiveTenant(memberships)
  if (!active) return null

  const [companies, { rows: contracts, total }] = await Promise.all([
    listCompanies(active.tenantId),
    listContractsPage(active.tenantId, {
      page,
      pageSize: PAGE_SIZE,
      companyId: company,
      status,
    }),
  ])

  const companyOptions = companies.map((item) => ({
    id: item.id,
    name: item.name,
  }))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Contratos</h1>
          <p className="text-muted-foreground text-sm">
            {total} contrato(s) · vigência e valores.
          </p>
        </div>
        <ContractFormDialog companies={companyOptions} label="Novo contrato" />
      </div>

      <form
        method="get"
        action="/app/contratos"
        className="flex flex-wrap items-end gap-2"
      >
        <select
          name="company"
          defaultValue={company ?? ""}
          className={fieldClass}
        >
          <option value="">Todos os clientes</option>
          {companyOptions.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={status ?? ""}
          className={fieldClass}
        >
          <option value="">Todos os status</option>
          {Object.entries(CONTRACT_STATUSES).map(([value, config]) => (
            <option key={value} value={value}>
              {config.label}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline" size="sm">
          Filtrar
        </Button>
        {company || status ? (
          <Link
            href="/app/contratos"
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
              <TableHead>Título</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Início</TableHead>
              <TableHead>Término</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="w-0" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {contracts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <div className="text-muted-foreground flex flex-col items-center gap-1 text-sm">
                    <FileSignature className="size-5" />
                    Nenhum contrato cadastrado ainda.
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              contracts.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell className="font-medium">
                    {contract.title}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {contract.company?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(contract.start_date)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(contract.end_date)}
                  </TableCell>
                  <TableCell>
                    <ContractStatusBadge
                      status={contract.status}
                      endDate={contract.end_date}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    {formatMoney(contract.value)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <ContractFormDialog
                        contract={contract}
                        companies={companyOptions}
                        label="Editar"
                      />
                      <DeleteContractButton id={contract.id} />
                    </div>
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
          if (company) params.set("company", company)
          if (status) params.set("status", status)
          if (target > 1) params.set("page", String(target))
          const query = params.toString()
          return query ? `/app/contratos?${query}` : "/app/contratos"
        }}
      />
    </div>
  )
}

import type { NextRequest } from "next/server"
import { getMemberships } from "@/lib/auth"
import { getActiveTenant } from "@/lib/tenant"
import { toCsv } from "@/lib/csv"
import { INVOICE_STATUSES, ESTIMATE_STATUSES } from "@/lib/constants"
import { listCompanies } from "@/server/queries/companies"
import { listLeads } from "@/server/queries/leads"
import { listEstimates, listInvoices } from "@/server/queries/documents"
import { listExpenses } from "@/server/queries/expenses"
import { listTimeEntries, formatDuration } from "@/server/queries/time"

function csvResponse(filename: string, csv: string) {
  return new Response(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ entity: string }> },
) {
  const memberships = await getMemberships()
  const active = await getActiveTenant(memberships)
  if (!active) {
    return new Response("Não autorizado", { status: 401 })
  }

  const { entity } = await params
  const tenantId = active.tenantId
  const search = request.nextUrl.searchParams
  const stamp = new Date().toISOString().slice(0, 10)

  switch (entity) {
    case "clientes": {
      const rows = await listCompanies(tenantId)
      const csv = toCsv(
        ["Nome", "Telefone", "Site", "Cidade", "País"],
        rows.map((row) => [
          row.name,
          row.phone,
          row.website,
          row.city,
          row.country,
        ]),
      )
      return csvResponse(`clientes-${stamp}.csv`, csv)
    }

    case "leads": {
      const rows = await listLeads(tenantId, {
        statusId: search.get("status") ?? undefined,
      })
      const csv = toCsv(
        ["Nome", "Empresa", "E-mail", "Status", "Responsável", "Valor"],
        rows.map((row) => [
          row.name,
          row.company,
          row.email,
          row.status?.name ?? null,
          row.assignee_name,
          row.value,
        ]),
      )
      return csvResponse(`leads-${stamp}.csv`, csv)
    }

    case "orcamentos": {
      const rows = await listEstimates(tenantId)
      const csv = toCsv(
        ["Número", "Cliente", "Data", "Validade", "Status", "Total"],
        rows.map((row) => [
          row.formatted_number,
          row.company?.name ?? null,
          row.date,
          row.expiry_date,
          ESTIMATE_STATUSES[row.status as keyof typeof ESTIMATE_STATUSES]
            ?.label ?? String(row.status),
          row.total,
        ]),
      )
      return csvResponse(`orcamentos-${stamp}.csv`, csv)
    }

    case "faturas": {
      const rows = await listInvoices(tenantId)
      const csv = toCsv(
        ["Número", "Cliente", "Data", "Vencimento", "Status", "Total"],
        rows.map((row) => [
          row.formatted_number,
          row.company?.name ?? null,
          row.date,
          row.due_date,
          INVOICE_STATUSES[row.status as keyof typeof INVOICE_STATUSES]
            ?.label ?? String(row.status),
          row.total,
        ]),
      )
      return csvResponse(`faturas-${stamp}.csv`, csv)
    }

    case "despesas": {
      const rows = await listExpenses(tenantId, {
        projectId: search.get("project") ?? undefined,
        companyId: search.get("company") ?? undefined,
      })
      const csv = toCsv(
        [
          "Data",
          "Descrição",
          "Categoria",
          "Projeto",
          "Cliente",
          "Faturável",
          "Valor",
        ],
        rows.map((row) => [
          row.date,
          row.title,
          row.category,
          row.project?.name ?? null,
          row.company?.name ?? null,
          row.billable ? "Sim" : "Não",
          row.amount,
        ]),
      )
      return csvResponse(`despesas-${stamp}.csv`, csv)
    }

    case "timesheet": {
      const rows = await listTimeEntries(tenantId)
      const csv = toCsv(
        [
          "Data",
          "Usuário",
          "Projeto",
          "Tarefa",
          "Duração",
          "Faturável",
          "Valor",
        ],
        rows.map((row) => {
          const seconds =
            row.duration_seconds ??
            Math.max(
              0,
              Math.round(
                (Date.now() - new Date(row.started_at).getTime()) / 1000,
              ),
            )
          const value =
            row.is_billable && row.rate
              ? Number(((seconds / 3600) * Number(row.rate)).toFixed(2))
              : null
          return [
            new Date(row.started_at).toLocaleDateString("pt-BR"),
            row.user_name,
            row.project?.name ?? null,
            row.task?.name ?? null,
            formatDuration(seconds),
            row.is_billable ? "Sim" : "Não",
            value,
          ]
        }),
      )
      return csvResponse(`timesheet-${stamp}.csv`, csv)
    }

    default:
      return new Response("Recurso não encontrado", { status: 404 })
  }
}

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
import { getReportData } from "@/server/queries/reports"

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

    case "relatorios": {
      const report = search.get("report")
      const data = await getReportData(tenantId, {
        days: Number(search.get("range") ?? "90"),
        companyId: search.get("company") ?? undefined,
        projectId: search.get("project") ?? undefined,
      })

      let headers: string[] = []
      let rows: (string | number | null)[][] = []

      switch (report) {
        case "leads": {
          headers = [
            "Origem",
            "Leads",
            "Ganhos",
            "Perdidos",
            "Abertos",
            "Conversão (%)",
            "Valor ganho",
          ]
          rows = data.conversionRows.map((row) => [
            row.source,
            row.total,
            row.won,
            row.lost,
            row.open,
            row.rate,
            row.wonValue,
          ])
          break
        }
        case "financeiro": {
          headers = ["Mês", "Faturamento"]
          rows = data.months.map((month) => [month.label, month.total])
          break
        }
        case "rentabilidade": {
          headers = ["Escopo", "Nome", "Faturado", "Despesas", "Margem"]
          rows = [
            ...data.profitByProject.map((row) => [
              "Projeto",
              row.label,
              row.revenue,
              row.expense,
              row.margin,
            ]),
            ...data.profitByClient.map((row) => [
              "Cliente",
              row.label,
              row.revenue,
              row.expense,
              row.margin,
            ]),
          ]
          break
        }
        case "produtividade": {
          headers = ["Pessoa", "Tarefas concluídas", "Horas", "Valor faturável"]
          rows = data.productivity.map((row) => [
            row.name,
            row.tasksDone,
            formatDuration(row.seconds),
            row.billableAmount,
          ])
          break
        }
        case "despesas": {
          headers = ["Escopo", "Nome", "Valor"]
          rows = [
            ...data.topCategories.map(([name, value]) => [
              "Categoria",
              name,
              value,
            ]),
            ...data.topExpenseProjects.map(([name, value]) => [
              "Projeto",
              name,
              value,
            ]),
          ]
          break
        }
        case "horas": {
          headers = ["Escopo", "Nome", "Duração"]
          rows = [
            ...data.topProjects.map(([name, seconds]) => [
              "Projeto",
              name,
              formatDuration(seconds),
            ]),
            ...data.topUsers.map(([name, seconds]) => [
              "Pessoa",
              name,
              formatDuration(seconds),
            ]),
          ]
          break
        }
        default:
          return new Response("Relatório não encontrado", { status: 404 })
      }

      const csv = toCsv(headers, rows)
      return csvResponse(`relatorio-${report}-${stamp}.csv`, csv)
    }

    default:
      return new Response("Recurso não encontrado", { status: 404 })
  }
}

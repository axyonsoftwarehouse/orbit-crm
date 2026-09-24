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
import { formatMoney } from "@/lib/format"
import { createClient } from "@/lib/supabase/server"
import { CreateTenantForm } from "./create-tenant-form"
import { PlanFormDialog, type PlanRow } from "./plan-form-dialog"
import { SetPlanSelect } from "./set-plan-select"
import { DeletePlanButton, DeleteTenantButton } from "./admin-buttons"

type Tenant = {
  id: string
  name: string
  slug: string
  status: string
  plan_id: string | null
  created_at: string
}

const LIMIT_LABELS: Record<string, string> = {
  clients: "Clientes",
  projects: "Projetos",
  tasks: "Tarefas",
  tickets: "Tickets",
  leads: "Leads",
}

function limitsSummary(limits: Record<string, number | null> | null) {
  if (!limits) return "—"
  return Object.entries(LIMIT_LABELS)
    .map(([key, label]) => {
      const value = limits[key]
      return `${label}: ${value === null || value === undefined ? "∞" : value}`
    })
    .join(" · ")
}

export default async function PlatformPage() {
  const supabase = await createClient()
  const [{ data: tenantsData }, { data: plansData }] = await Promise.all([
    supabase
      .from("tenants")
      .select("id, name, slug, status, plan_id, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("plans").select("*").order("price", { ascending: true }),
  ])

  const tenants = (tenantsData ?? []) as Tenant[]
  const plans = (plansData ?? []) as PlanRow[]
  const planOptions = plans.map((plan) => ({ id: plan.id, name: plan.name }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Empresas</h1>
        <p className="text-muted-foreground text-sm">
          Crie e gerencie as empresas (tenants) e os planos da plataforma.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nova empresa</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateTenantForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Planos</CardTitle>
          <PlanFormDialog label="Novo plano" />
        </CardHeader>
        <CardContent className="space-y-2">
          {plans.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Nenhum plano cadastrado.
            </p>
          ) : (
            plans.map((plan) => (
              <div
                key={plan.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-heading text-sm font-semibold">
                      {plan.name}
                    </span>
                    {plan.most_popular ? (
                      <Badge variant="secondary">Mais popular</Badge>
                    ) : null}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {limitsSummary(plan.limits)}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">
                    {formatMoney(Number(plan.price))}
                    <span className="text-muted-foreground">
                      /{plan.interval === "yearly" ? "ano" : "mês"}
                    </span>
                  </span>
                  <PlanFormDialog plan={plan} label="Editar" />
                  <DeletePlanButton id={plan.id} />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Empresas cadastradas</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criada em</TableHead>
                <TableHead className="w-0" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-muted-foreground text-center text-sm"
                  >
                    Nenhuma empresa cadastrada ainda.
                  </TableCell>
                </TableRow>
              ) : (
                tenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell className="font-medium">{tenant.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {tenant.slug}
                    </TableCell>
                    <TableCell className="w-48">
                      <SetPlanSelect
                        tenantId={tenant.id}
                        planId={tenant.plan_id}
                        plans={planOptions}
                      />
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          tenant.status === "active" ? "default" : "secondary"
                        }
                      >
                        {tenant.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(tenant.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-right">
                      <DeleteTenantButton id={tenant.id} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

import { Trophy } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { formatDate, formatMoney } from "@/lib/format"
import { getMemberships } from "@/lib/auth"
import { getActiveTenant } from "@/lib/tenant"
import { listGoals, type GoalMetric } from "@/server/queries/goals"
import { GoalFormDialog } from "./goal-form-dialog"
import { DeleteGoalButton } from "./delete-goal-button"

const METRICS: Record<
  GoalMetric,
  { label: string; format: (value: number) => string }
> = {
  revenue: { label: "Faturamento", format: (value) => formatMoney(value) },
  leads: { label: "Novos leads", format: (value) => String(value) },
  hours: { label: "Horas faturáveis", format: (value) => `${value} h` },
}

export default async function MetasPage() {
  const memberships = await getMemberships()
  const active = await getActiveTenant(memberships)
  if (!active) return null

  const goals = await listGoals(active.tenantId)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Metas</h1>
          <p className="text-muted-foreground text-sm">
            {goals.length} meta(s) · acompanhe o alcance por período.
          </p>
        </div>
        <GoalFormDialog label="Nova meta" />
      </div>

      {goals.length === 0 ? (
        <div className="text-muted-foreground rounded-2xl border border-dashed p-12 text-center text-sm">
          Nenhuma meta cadastrada ainda.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {goals.map((goal) => {
            const metric = METRICS[goal.metric]
            const reached = goal.progress >= 100
            return (
              <Card key={goal.id}>
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Trophy
                      className={cn(
                        "size-4",
                        reached ? "text-[#3dd598]" : "text-muted-foreground",
                      )}
                    />
                    {goal.title || metric.label}
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    <GoalFormDialog goal={goal} label="Editar" />
                    <DeleteGoalButton id={goal.id} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-muted-foreground text-xs">
                    {metric.label} · {formatDate(goal.period_start)} –{" "}
                    {formatDate(goal.period_end)}
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="font-heading text-2xl font-semibold">
                      {metric.format(goal.achieved)}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      de {metric.format(goal.target)}
                    </span>
                  </div>
                  <div className="bg-muted h-2.5 overflow-hidden rounded-full">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        reached ? "bg-[#3dd598]" : "bg-primary",
                      )}
                      style={{ width: `${Math.min(goal.progress, 100)}%` }}
                    />
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {goal.progress}% da meta
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

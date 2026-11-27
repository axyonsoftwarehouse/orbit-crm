import Link from "next/link"
import { CalendarClock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatNextStep, isNextStepOverdue } from "@/lib/lead-activity"
import { cn } from "@/lib/utils"
import { completeLeadNextStepAction } from "@/server/actions/leads"
import type { OpenNextStep } from "@/server/queries/lead-next-steps"

/** Próximos passos de hoje e atrasados do usuário (painel). */
export function NextStepsCard({ steps }: { steps: OpenNextStep[] }) {
  const overdue = steps.filter((step) => isNextStepOverdue(step.next_step_at))

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarClock className="size-4" />
          Meus próximos passos
        </CardTitle>
        {overdue.length > 0 ? (
          <Badge variant="destructive">
            {overdue.length} {overdue.length === 1 ? "atrasado" : "atrasados"}
          </Badge>
        ) : null}
      </CardHeader>
      <CardContent>
        {steps.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Nada para hoje. Agende o próximo passo ao registrar uma atividade no
            lead.
          </p>
        ) : (
          <ul className="divide-y">
            {steps.map((step) => (
              <li
                key={step.id}
                className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0"
              >
                <div className="min-w-0 text-sm">
                  <Link
                    href={`/app/leads/${step.lead_id}`}
                    className="block truncate font-medium hover:underline"
                  >
                    {step.lead_name}
                  </Link>
                  <p className="text-muted-foreground truncate text-xs">
                    <span
                      className={cn(
                        isNextStepOverdue(step.next_step_at) &&
                          "text-destructive",
                      )}
                    >
                      {formatNextStep(step.next_step_at)}
                    </span>
                    {" · "}
                    {step.next_step_note ?? "Sem descrição"}
                  </p>
                </div>
                <form action={completeLeadNextStepAction} className="shrink-0">
                  <input type="hidden" name="id" value={step.id} />
                  <input type="hidden" name="lead_id" value={step.lead_id} />
                  <Button type="submit" variant="ghost" size="xs">
                    Feito
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

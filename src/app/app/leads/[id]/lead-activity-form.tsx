"use client"

import { useActionState, useEffect, useRef } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { LEAD_ACTIVITY_TYPES } from "@/lib/lead-activity"
import {
  addLeadActivityAction,
  type LeadActivityFormState,
} from "@/server/actions/leads"

const fieldClass =
  "border-input bg-background dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3"

export function LeadActivityForm({ leadId }: { leadId: string }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [state, formAction, isPending] = useActionState<
    LeadActivityFormState,
    FormData
  >(addLeadActivityAction, undefined)

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset()
      toast.success(state.success)
    } else if (state?.error) {
      toast.error(state.error)
    }
  }, [state])

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <input type="hidden" name="lead_id" value={leadId} />
      <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
        <div className="space-y-2">
          <Label htmlFor="activity-type">Tipo</Label>
          <select
            id="activity-type"
            name="type"
            defaultValue="call"
            className={fieldClass}
          >
            {Object.entries(LEAD_ACTIVITY_TYPES).map(([value, config]) => (
              <option key={value} value={value}>
                {config.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="activity-description">O que aconteceu</Label>
          <Textarea
            id="activity-description"
            name="description"
            rows={2}
            placeholder="Registrar uma interação..."
            required
            maxLength={2000}
          />
        </div>
      </div>

      <fieldset className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[200px_1fr]">
        <legend className="px-1 text-sm font-medium">
          Próximo passo (opcional)
        </legend>
        <div className="space-y-2">
          <Label htmlFor="activity-next-at">Quando</Label>
          <Input
            id="activity-next-at"
            name="next_step_at"
            type="datetime-local"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="activity-next-note">O que fazer</Label>
          <Input
            id="activity-next-note"
            name="next_step_note"
            placeholder="Ex.: ligar para fechar a proposta"
            maxLength={500}
          />
        </div>
        <p className="text-muted-foreground text-xs sm:col-span-2">
          No dia, o responsável pelo lead (ou quem registrou, se não houver)
          recebe um lembrete pela manhã, no sino e por e-mail. O próximo passo
          também aparece no painel e no calendário.
        </p>
      </fieldset>

      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Salvando..." : "Registrar"}
        </Button>
      </div>
    </form>
  )
}

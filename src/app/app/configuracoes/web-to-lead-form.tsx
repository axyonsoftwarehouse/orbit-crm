"use client"

import { useActionState, useEffect, useState } from "react"
import { toast } from "sonner"
import { Check, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  updateWebToLeadAction,
  type TenantSettingsState,
} from "@/server/actions/tenant"

const fieldClass =
  "border-input bg-background dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3"

export function WebToLeadForm({
  enabled,
  sourceId,
  slug,
  sources,
  canManage,
}: {
  enabled: boolean
  sourceId: string | null
  slug: string
  sources: { id: string; name: string }[]
  canManage: boolean
}) {
  const [state, formAction, isPending] = useActionState<
    TenantSettingsState,
    FormData
  >(updateWebToLeadAction, undefined)
  const [on, setOn] = useState(enabled)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (state?.success) toast.success(state.success)
    else if (state?.error) toast.error(state.error)
  }, [state])

  function copy() {
    const url = `${window.location.origin}/f/${slug}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (!canManage) {
    return (
      <div className="space-y-2 rounded-2xl border p-5">
        <p className="text-sm">
          Formulário público: {enabled ? "ativo" : "inativo"}
        </p>
        <p className="text-muted-foreground text-xs">/f/{slug}</p>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border p-5">
      <div>
        <h2 className="font-heading text-sm font-semibold">
          Formulário público (web-to-lead)
        </h2>
        <p className="text-muted-foreground text-xs">
          Capture leads por uma página pública; os envios entram como leads.
        </p>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="web_to_lead_enabled"
          checked={on}
          onChange={(event) => setOn(event.target.checked)}
          className="accent-primary size-4"
        />
        Ativar formulário público
      </label>

      <div className="space-y-2">
        <Label htmlFor="wtl-source">Origem dos leads captados</Label>
        <select
          id="wtl-source"
          name="web_to_lead_source_id"
          defaultValue={sourceId ?? ""}
          className={fieldClass}
        >
          <option value="">— Nenhuma —</option>
          {sources.map((source) => (
            <option key={source.id} value={source.id}>
              {source.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label>Link do formulário</Label>
        <div className="flex items-center gap-2">
          <code className="bg-muted flex-1 truncate rounded-lg px-2 py-1.5 text-xs">
            /f/{slug}
          </code>
          <Button type="button" variant="outline" size="sm" onClick={copy}>
            {copied ? (
              <Check className="size-4" />
            ) : (
              <Copy className="size-4" />
            )}
          </Button>
        </div>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  )
}

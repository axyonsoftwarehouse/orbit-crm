"use client"

import { Button } from "@/components/ui/button"
import { resetEmailTemplateAction } from "@/server/actions/email"

export function ResetEmailTemplateButton({
  templateKey,
}: {
  templateKey: string
}) {
  return (
    <form
      action={resetEmailTemplateAction}
      onSubmit={(event) => {
        if (!confirm("Restaurar o modelo padrão?")) event.preventDefault()
      }}
    >
      <input type="hidden" name="key" value={templateKey} />
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:text-destructive"
      >
        Restaurar
      </Button>
    </form>
  )
}

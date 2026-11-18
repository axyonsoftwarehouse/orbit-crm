"use client"

import { useState } from "react"
import { Check, Copy, CornerDownLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { DraftReplyInput } from "@/lib/ai/assistant-schemas"
import { TICKET_REPLY_FIELD_ID } from "./constants"

export function ReplyDraftCard({ input }: { input: DraftReplyInput }) {
  const [copied, setCopied] = useState(false)
  const [used, setUsed] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(input.body)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  function useInReply() {
    const field = document.getElementById(TICKET_REPLY_FIELD_ID)
    if (!(field instanceof HTMLTextAreaElement)) return
    field.value = input.body
    field.focus()
    field.scrollIntoView({ block: "center", behavior: "smooth" })
    setUsed(true)
  }

  return (
    <div className="bg-background space-y-2 rounded-lg border p-3 text-sm">
      <p className="text-muted-foreground text-xs font-medium">
        Rascunho de resposta
      </p>
      <p className="whitespace-pre-wrap">{input.body}</p>
      <div className="flex flex-wrap gap-2 pt-1">
        <Button type="button" size="sm" variant="outline" onClick={useInReply}>
          {used ? <Check /> : <CornerDownLeft />}
          Usar na resposta
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={copy}>
          {copied ? <Check /> : <Copy />}
          Copiar
        </Button>
      </div>
    </div>
  )
}

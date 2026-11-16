"use client"

import { useState } from "react"
import { Check, Copy, Mail } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import type { DraftEmailInput } from "@/lib/ai/assistant-schemas"

export function mailtoHref(input: DraftEmailInput): string | null {
  if (!input.to_email) return null
  const subject = encodeURIComponent(input.subject)
  const body = encodeURIComponent(input.body)
  return `mailto:${input.to_email}?subject=${subject}&body=${body}`
}

export function EmailDraftCard({ input }: { input: DraftEmailInput }) {
  const [copied, setCopied] = useState(false)
  const href = mailtoHref(input)
  const recipient = [input.to_name, input.to_email && `<${input.to_email}>`]
    .filter(Boolean)
    .join(" ")

  async function copy() {
    try {
      await navigator.clipboard.writeText(`${input.subject}\n\n${input.body}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="bg-background space-y-2 rounded-lg border p-3 text-sm">
      <p className="text-muted-foreground text-xs font-medium">
        Rascunho de e-mail
      </p>
      {recipient && (
        <p>
          <span className="text-muted-foreground">Para: </span>
          {recipient}
        </p>
      )}
      <p>
        <span className="text-muted-foreground">Assunto: </span>
        {input.subject}
      </p>
      <p className="whitespace-pre-wrap">{input.body}</p>
      <div className="flex flex-wrap gap-2 pt-1">
        <Button type="button" size="sm" variant="outline" onClick={copy}>
          {copied ? <Check /> : <Copy />}
          Copiar
        </Button>
        {href && (
          <a
            href={href}
            className={buttonVariants({ size: "sm", variant: "outline" })}
          >
            <Mail />
            Abrir no e-mail
          </a>
        )}
      </div>
    </div>
  )
}

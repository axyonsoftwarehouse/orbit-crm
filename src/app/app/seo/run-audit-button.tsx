"use client"

import { useFormStatus } from "react-dom"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { runSeoAuditAction } from "@/server/actions/seo"
import { cn } from "@/lib/utils"

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" size="sm" variant="outline" disabled={pending}>
      <RefreshCw className={cn("size-3.5", pending && "animate-spin")} />
      {pending ? "Auditando..." : label}
    </Button>
  )
}

export function RunAuditButton({
  siteId,
  label = "Auditar agora",
}: {
  siteId: string
  label?: string
}) {
  return (
    <form action={runSeoAuditAction}>
      <input type="hidden" name="site_id" value={siteId} />
      <SubmitButton label={label} />
    </form>
  )
}

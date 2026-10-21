"use client"

import { useActionState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sparkles } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  generateSeoAiSummaryAction,
  type SeoAiSummaryState,
} from "@/server/actions/seo"

export function GenerateAiSummaryButton({
  siteId,
  auditId,
}: {
  siteId: string
  auditId: string
}) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState<
    SeoAiSummaryState,
    FormData
  >(generateSeoAiSummaryAction, undefined)

  useEffect(() => {
    if (state?.success) {
      toast.success(state.success)
      router.refresh()
    } else if (state?.error) {
      toast.error(state.error)
    }
  }, [state, router])

  return (
    <form action={formAction}>
      <input type="hidden" name="site_id" value={siteId} />
      <input type="hidden" name="audit_id" value={auditId} />
      <Button type="submit" size="sm" variant="outline" disabled={isPending}>
        <Sparkles className="size-3.5" />
        {isPending ? "Gerando..." : "Gerar resumo com IA"}
      </Button>
    </form>
  )
}

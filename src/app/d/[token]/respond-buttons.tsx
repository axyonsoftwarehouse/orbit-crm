"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { respondPublicEstimateAction } from "@/server/actions/public-document"

export function RespondButtons({ token }: { token: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState<"accept" | "decline" | null>(
    null,
  )
  const [error, setError] = useState<string | null>(null)

  function respond(accept: boolean) {
    setError(null)
    startTransition(async () => {
      const result = await respondPublicEstimateAction(token, accept)
      if ("error" in result) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  if (confirming) {
    const accept = confirming === "accept"
    return (
      <div className="space-y-3 rounded-xl border p-4">
        <p className="text-sm">
          {accept
            ? "Confirmar o aceite deste orçamento?"
            : "Confirmar a recusa deste orçamento?"}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => respond(accept)}
            disabled={isPending}
            variant={accept ? "default" : "destructive"}
          >
            {isPending
              ? "Enviando..."
              : accept
                ? "Sim, aceitar"
                : "Sim, recusar"}
          </Button>
          <Button
            variant="outline"
            onClick={() => setConfirming(null)}
            disabled={isPending}
          >
            Voltar
          </Button>
        </div>
        {error ? <p className="text-destructive text-sm">{error}</p> : null}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setConfirming("accept")}>
          Aceitar orçamento
        </Button>
        <Button variant="outline" onClick={() => setConfirming("decline")}>
          Recusar
        </Button>
      </div>
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
    </div>
  )
}

"use client"

import { useEffect } from "react"
import * as Sentry from "@sentry/nextjs"
import { Button } from "@/components/ui/button"

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="max-w-md space-y-3 text-center">
        <h1 className="text-lg font-semibold">Algo deu errado</h1>
        <p className="text-muted-foreground text-sm">
          Não foi possível carregar esta página. Tente novamente em instantes.
        </p>
        {error.digest ? (
          <p className="text-muted-foreground text-xs">
            Código do erro: {error.digest}
          </p>
        ) : null}
        <Button onClick={() => reset()}>Tentar novamente</Button>
      </div>
    </div>
  )
}

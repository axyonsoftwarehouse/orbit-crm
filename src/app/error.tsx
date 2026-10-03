"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="max-w-md space-y-3 text-center">
        <h1 className="text-lg font-semibold">Algo deu errado</h1>
        <p className="text-muted-foreground text-sm">
          {error.message || "Não foi possível carregar esta página."}
        </p>
        <Button onClick={() => reset()}>Tentar novamente</Button>
      </div>
    </div>
  )
}

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="max-w-sm space-y-3 text-center">
        <p className="text-muted-foreground text-sm">404</p>
        <h1 className="text-lg font-semibold">Página não encontrada</h1>
        <Button nativeButton={false} render={<Link href="/app" />}>
          Ir para o app
        </Button>
      </div>
    </div>
  )
}

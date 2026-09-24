import Link from "next/link"
import { Button } from "@/components/ui/button"
import { APP_NAME } from "@/lib/constants"
import { requireSuperAdmin } from "@/lib/auth"

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireSuperAdmin()

  return (
    <div className="bg-background min-h-svh">
      <header className="bg-background/80 sticky top-0 z-10 flex h-16 items-center justify-between border-b px-6 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-xl">
            <span className="font-heading text-lg font-bold">O</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-heading font-semibold">{APP_NAME}</span>
            <span className="text-muted-foreground text-xs">plataforma</span>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link href="/app" />}
        >
          Voltar ao app
        </Button>
      </header>
      <main className="mx-auto max-w-5xl p-6">{children}</main>
    </div>
  )
}

import Link from "next/link"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { getUser } from "@/lib/auth"
import { getPortalContact } from "@/server/queries/portal"
import { portalSignOutAction } from "@/server/actions/portal"
import { PortalNav } from "./portal-nav"

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()
  if (!user) redirect("/portal/login")

  const contact = await getPortalContact()

  if (!contact) {
    return (
      <div className="flex min-h-svh items-center justify-center p-4">
        <div className="max-w-sm space-y-4 text-center">
          <h1 className="font-heading text-lg font-semibold">
            Sem acesso ao portal
          </h1>
          <p className="text-muted-foreground text-sm">
            Sua conta não está vinculada a nenhum cliente. Fale com a empresa
            responsável.
          </p>
          <form action={portalSignOutAction}>
            <Button type="submit" variant="outline">
              Sair
            </Button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background min-h-svh">
      <header className="bg-background/80 sticky top-0 z-10 border-b backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 md:px-6">
          <Link href="/portal" className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-xl">
              <span className="font-heading text-lg font-bold">O</span>
            </div>
            <div className="leading-tight">
              <div className="font-heading text-sm font-semibold">
                Portal do cliente
              </div>
              <div className="text-muted-foreground text-xs">
                {contact.company_name}
              </div>
            </div>
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-muted-foreground hidden text-sm sm:block">
              {contact.first_name}
            </span>
            <form action={portalSignOutAction}>
              <Button type="submit" variant="outline" size="sm">
                Sair
              </Button>
            </form>
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <PortalNav />
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-4 md:p-6">{children}</main>
    </div>
  )
}

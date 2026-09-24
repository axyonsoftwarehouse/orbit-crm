import Link from "next/link"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { AppSidebar } from "@/components/app/app-sidebar"
import { ThemeToggle } from "@/components/app/theme-toggle"
import { SearchDialog } from "@/components/app/search-dialog"
import { NewMenu } from "@/components/app/new-menu"
import { UserMenu } from "@/components/app/user-menu"
import { NotificationsBell } from "@/components/app/notifications-bell"
import { listNotifications, unreadCount } from "@/server/queries/notifications"
import { getActiveTenant } from "@/lib/tenant"
import { getMemberships, getProfile, requireUser } from "@/lib/auth"
import { signOutAction } from "@/server/actions/auth"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireUser()
  const [profile, memberships] = await Promise.all([
    getProfile(),
    getMemberships(),
  ])
  const active = await getActiveTenant(memberships)

  const [notifications, unread] = active
    ? await Promise.all([
        listNotifications(active.tenant.id, user.id),
        unreadCount(active.tenant.id, user.id),
      ])
    : [[], 0]

  if (!active) {
    return (
      <div className="flex min-h-svh items-center justify-center p-4">
        <div className="max-w-sm space-y-4 text-center">
          <h1 className="text-lg font-semibold">Nenhuma empresa vinculada</h1>
          <p className="text-muted-foreground text-sm">
            Sua conta ainda não está associada a uma empresa. Peça ao
            administrador da plataforma para convidá-lo.
          </p>
          {profile?.is_super_admin ? (
            <Button nativeButton={false} render={<Link href="/plataforma" />}>
              Ir para a plataforma
            </Button>
          ) : null}
          <form action={signOutAction}>
            <Button type="submit" variant="outline">
              Sair
            </Button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar memberships={memberships} activeTenantId={active.tenant.id} />
      <SidebarInset>
        <header className="bg-background/80 flex h-16 shrink-0 items-center gap-3 border-b px-4 backdrop-blur md:px-6">
          <SidebarTrigger />
          <Separator
            orientation="vertical"
            className="data-[orientation=vertical]:h-5"
          />
          <span className="font-heading text-sm font-semibold">
            {active.tenant.name}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <SearchDialog />
            <NewMenu />
            <NotificationsBell notifications={notifications} unread={unread} />
            <ThemeToggle />
            <UserMenu profile={profile} email={user.email ?? null} />
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}

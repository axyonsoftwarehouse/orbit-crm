"use client"

import { useTransition } from "react"
import { Building2, Check, ChevronsUpDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { setActiveTenantAction } from "@/server/actions/tenant"
import type { Membership } from "@/lib/auth"

export function TenantSwitcher({
  memberships,
  activeTenantId,
}: {
  memberships: Membership[]
  activeTenantId?: string
}) {
  const [isPending, startTransition] = useTransition()
  const active =
    memberships.find((m) => m.tenant.id === activeTenantId) ?? memberships[0]

  if (!active) return null

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                disabled={isPending}
                className="data-popup-open:bg-sidebar-accent"
              />
            }
          >
            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
              <Building2 className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{active.tenant.name}</span>
              <span className="text-muted-foreground truncate text-xs">
                {active.role === "owner"
                  ? "Proprietário"
                  : active.role === "admin"
                    ? "Administrador"
                    : "Membro"}
              </span>
            </div>
            <ChevronsUpDown className="ml-auto size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--anchor-width) min-w-56"
            align="start"
            side="bottom"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel>Empresas</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {memberships.map((membership) => (
                <DropdownMenuItem
                  key={membership.tenant.id}
                  onClick={() =>
                    startTransition(() =>
                      setActiveTenantAction(membership.tenant.id),
                    )
                  }
                >
                  <Building2 className="size-4" />
                  <span className="truncate">{membership.tenant.name}</span>
                  {membership.tenant.id === active.tenant.id && (
                    <Check className="ml-auto size-4" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ShieldCheck } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { TenantSwitcher } from "./tenant-switcher"
import type { Membership } from "@/lib/auth"
import { NAV_ITEMS } from "./nav-items"

export function AppSidebar({
  memberships,
  activeTenantId,
  isSuperAdmin = false,
}: {
  memberships: Membership[]
  activeTenantId?: string
  isSuperAdmin?: boolean
}) {
  const pathname = usePathname()
  const items = isSuperAdmin
    ? [
        ...NAV_ITEMS,
        { title: "Plataforma", href: "/plataforma", icon: ShieldCheck },
      ]
    : NAV_ITEMS

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="gap-3">
        <p className="text-muted-foreground px-2 text-[11px] font-semibold tracking-wider uppercase group-data-[collapsible=icon]:hidden">
          Empresas
        </p>
        <TenantSwitcher
          memberships={memberships}
          activeTenantId={activeTenantId}
        />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    render={<Link href={item.href} />}
                    isActive={pathname === item.href}
                    tooltip={item.title}
                    className="font-heading h-10 text-sm font-medium"
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}

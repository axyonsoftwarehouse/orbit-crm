"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  BookOpen,
  Clock,
  FileText,
  FolderKanban,
  LayoutDashboard,
  LifeBuoy,
  ListChecks,
  Receipt,
  Settings,
  Target,
  Users,
  Wallet,
} from "lucide-react"
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

const NAV_ITEMS = [
  { title: "Visão geral", href: "/app", icon: LayoutDashboard },
  { title: "Clientes", href: "/app/clientes", icon: Users },
  { title: "Leads", href: "/app/leads", icon: Target },
  { title: "Projetos", href: "/app/projetos", icon: FolderKanban },
  { title: "Tarefas", href: "/app/tarefas", icon: ListChecks },
  { title: "Timesheet", href: "/app/timesheet", icon: Clock },
  { title: "Orçamentos", href: "/app/orcamentos", icon: FileText },
  { title: "Faturas", href: "/app/faturas", icon: Receipt },
  { title: "Despesas", href: "/app/despesas", icon: Wallet },
  { title: "Relatórios", href: "/app/relatorios", icon: BarChart3 },
  { title: "Tickets", href: "/app/tickets", icon: LifeBuoy },
  {
    title: "Base de conhecimento",
    href: "/app/base-conhecimento",
    icon: BookOpen,
  },
  { title: "Configurações", href: "/app/configuracoes", icon: Settings },
]

export function AppSidebar({
  memberships,
  activeTenantId,
}: {
  memberships: Membership[]
  activeTenantId?: string
}) {
  const pathname = usePathname()

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
              {NAV_ITEMS.map((item) => (
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

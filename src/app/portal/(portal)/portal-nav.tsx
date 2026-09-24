"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const ITEMS = [
  { href: "/portal", label: "Visão geral" },
  { href: "/portal/projetos", label: "Projetos" },
  { href: "/portal/orcamentos", label: "Orçamentos" },
  { href: "/portal/faturas", label: "Faturas" },
  { href: "/portal/tickets", label: "Tickets" },
  { href: "/portal/ajuda", label: "Ajuda" },
]

export function PortalNav() {
  const pathname = usePathname()

  return (
    <nav className="-mb-px flex gap-1">
      {ITEMS.map((item) => {
        const active =
          item.href === "/portal"
            ? pathname === "/portal"
            : pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "border-b-2 px-3 py-2.5 text-sm",
              active
                ? "border-primary text-primary font-medium"
                : "text-muted-foreground hover:text-foreground border-transparent",
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

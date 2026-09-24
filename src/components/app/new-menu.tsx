"use client"

import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const ITEMS = [
  { href: "/app/clientes", label: "Cliente" },
  { href: "/app/projetos", label: "Projeto" },
  { href: "/app/tarefas", label: "Tarefa" },
  { href: "/app/orcamentos", label: "Orçamento" },
  { href: "/app/faturas", label: "Fatura" },
]

export function NewMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button className="rounded-full" />}>
        <Plus className="size-4" />
        Novo
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        {ITEMS.map((item) => (
          <DropdownMenuItem key={item.href} render={<Link href={item.href} />}>
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

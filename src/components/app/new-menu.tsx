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
import { NEW_ITEMS } from "./nav-items"

export function NewMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button className="rounded-full" />}>
        <Plus className="size-4" />
        Novo
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        {NEW_ITEMS.map((item) => (
          <DropdownMenuItem key={item.href} render={<Link href={item.href} />}>
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

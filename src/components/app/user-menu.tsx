"use client"

import { useTransition } from "react"
import { LogOut } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { signOutAction } from "@/server/actions/auth"
import type { Profile } from "@/lib/auth"

function initials(name: string | null | undefined, email: string | null) {
  const source = name?.trim() || email?.split("@")[0] || "?"
  return source.slice(0, 2).toUpperCase()
}

export function UserMenu({
  profile,
  email,
}: {
  profile: Profile | null
  email: string | null
}) {
  const [isPending, startTransition] = useTransition()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label="Menu do usuário"
            className="focus-visible:ring-ring rounded-full outline-none focus-visible:ring-2"
          />
        }
      >
        <Avatar className="size-9">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
            {initials(profile?.full_name, email)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                {profile?.full_name ?? "Usuário"}
              </span>
              <span className="text-muted-foreground text-xs">{email}</span>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          disabled={isPending}
          onClick={() => startTransition(() => signOutAction())}
        >
          <LogOut className="size-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

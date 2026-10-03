"use client"

import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import {
  removeMemberAction,
  updateMemberRoleAction,
} from "@/server/actions/team"

const fieldClass =
  "border-input bg-background dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 h-8 rounded-lg border px-2 text-sm outline-none focus-visible:ring-3"

export function MemberRowActions({
  userId,
  role,
  canManage,
}: {
  userId: string
  role: string
  canManage: boolean
}) {
  const [isPending, startTransition] = useTransition()

  if (!canManage) {
    return (
      <span className="text-muted-foreground text-xs">
        {role === "owner"
          ? "Proprietário"
          : role === "admin"
            ? "Administrador"
            : "Membro"}
      </span>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={role}
        disabled={isPending}
        onChange={(event) =>
          startTransition(() =>
            updateMemberRoleAction({ userId, role: event.target.value }),
          )
        }
        className={fieldClass}
      >
        <option value="owner">Proprietário</option>
        <option value="admin">Administrador</option>
        <option value="member">Membro</option>
      </select>
      <form
        action={removeMemberAction}
        onSubmit={(event) => {
          if (!confirm("Remover este membro da empresa?"))
            event.preventDefault()
        }}
      >
        <input type="hidden" name="user_id" value={userId} />
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive"
        >
          Remover
        </Button>
      </form>
    </div>
  )
}

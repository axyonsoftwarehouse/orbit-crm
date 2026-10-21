"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  approveSocialPostAction,
  cancelSocialPostAction,
  deleteSocialPostAction,
  rejectSocialPostAction,
  scheduleSocialPostAction,
  submitSocialPostAction,
} from "@/server/actions/social"

export function SocialPostActions({
  id,
  status,
  canManage,
}: {
  id: string
  status: string
  canManage: boolean
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {status === "draft" || status === "rejected" ? (
          <form action={submitSocialPostAction}>
            <input type="hidden" name="id" value={id} />
            <Button type="submit" size="sm">
              Enviar para aprovação
            </Button>
          </form>
        ) : null}

        {status === "pending_approval" && canManage ? (
          <form action={approveSocialPostAction}>
            <input type="hidden" name="id" value={id} />
            <Button type="submit" size="sm">
              Aprovar
            </Button>
          </form>
        ) : null}

        {status === "approved" && canManage ? (
          <form
            action={scheduleSocialPostAction}
            className="flex flex-wrap items-end gap-2"
          >
            <input type="hidden" name="id" value={id} />
            <div className="space-y-1">
              <label
                htmlFor="social-schedule"
                className="text-muted-foreground text-xs"
              >
                Data e hora
              </label>
              <Input
                id="social-schedule"
                name="scheduled_at"
                type="datetime-local"
                required
                className="h-8"
              />
            </div>
            <Button type="submit" size="sm">
              Agendar
            </Button>
          </form>
        ) : null}

        {["draft", "pending_approval", "approved", "scheduled"].includes(
          status,
        ) && canManage ? (
          <form
            action={cancelSocialPostAction}
            onSubmit={(event) => {
              if (!confirm("Cancelar este post?")) event.preventDefault()
            }}
          >
            <input type="hidden" name="id" value={id} />
            <Button type="submit" size="sm" variant="outline">
              Cancelar
            </Button>
          </form>
        ) : null}

        {canManage ? (
          <form
            action={deleteSocialPostAction}
            onSubmit={(event) => {
              if (!confirm("Excluir este post?")) event.preventDefault()
            }}
          >
            <input type="hidden" name="id" value={id} />
            <Button
              type="submit"
              size="sm"
              variant="ghost"
              className="text-muted-foreground hover:text-destructive"
            >
              Excluir
            </Button>
          </form>
        ) : null}
      </div>

      {status === "pending_approval" && canManage ? (
        <form
          action={rejectSocialPostAction}
          className="flex flex-wrap items-end gap-2 rounded-xl border p-3"
        >
          <input type="hidden" name="id" value={id} />
          <div className="min-w-48 flex-1 space-y-1">
            <label
              htmlFor="social-reject-note"
              className="text-muted-foreground text-xs"
            >
              Motivo da rejeição
            </label>
            <Input
              id="social-reject-note"
              name="note"
              placeholder="Opcional"
              className="h-8"
            />
          </div>
          <Button type="submit" size="sm" variant="destructive">
            Rejeitar
          </Button>
        </form>
      ) : null}
    </div>
  )
}

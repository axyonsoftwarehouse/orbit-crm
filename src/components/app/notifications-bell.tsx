"use client"

import { useEffect, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Bell } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/server/actions/notifications"
import type { NotificationRow } from "@/server/queries/notifications"

export function NotificationsBell({
  notifications,
  unread,
}: {
  notifications: NotificationRow[]
  unread: number
}) {
  const [, startTransition] = useTransition()
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    let channel: ReturnType<typeof supabase.channel> | null = null

    supabase.auth.getUser().then(({ data }) => {
      const userId = data.user?.id
      if (!userId) return
      channel = supabase
        .channel(`notifications-${userId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userId}`,
          },
          () => router.refresh(),
        )
        .subscribe()
    })

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [router])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label="Notificações"
            className="hover:bg-muted focus-visible:ring-ring relative flex size-9 items-center justify-center rounded-full outline-none focus-visible:ring-2"
          />
        }
      >
        <Bell className="size-5" />
        {unread > 0 ? (
          <span className="bg-destructive absolute top-1 right-1 flex size-4 items-center justify-center rounded-full text-[10px] font-medium text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="text-muted-foreground flex items-center justify-between px-1.5 py-1 text-xs font-medium">
          <span>Notificações</span>
          {unread > 0 ? (
            <button
              type="button"
              className="text-primary text-xs hover:underline"
              onClick={() =>
                startTransition(() => markAllNotificationsReadAction())
              }
            >
              Marcar lidas
            </button>
          ) : null}
        </div>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="text-muted-foreground p-3 text-sm">
            Nada por aqui.
          </div>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              render={<Link href={notification.url ?? "#"} />}
              onClick={() =>
                startTransition(() =>
                  markNotificationReadAction({ id: notification.id }),
                )
              }
              className="flex-col items-start gap-0.5"
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                {!notification.read_at ? (
                  <span className="bg-primary size-2 shrink-0 rounded-full" />
                ) : null}
                {notification.title}
              </span>
              {notification.body ? (
                <span className="text-muted-foreground text-xs">
                  {notification.body}
                </span>
              ) : null}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

"use client"

import { useTransition } from "react"
import Link from "next/link"
import { Bell } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
        <DropdownMenuLabel className="flex items-center justify-between">
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
        </DropdownMenuLabel>
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

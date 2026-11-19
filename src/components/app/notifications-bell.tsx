"use client"

import { useCallback, useEffect, useState, useTransition } from "react"
import Link from "next/link"
import { Bell } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  getNotificationsAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/server/actions/notifications"
import type { NotificationRow } from "@/server/queries/notifications"

/** Intervalo da consulta do sino enquanto a aba está visível. */
const POLL_MS = 30_000

export function NotificationsBell({
  notifications: initialNotifications,
  unread: initialUnread,
}: {
  notifications: NotificationRow[]
  unread: number
}) {
  const [, startTransition] = useTransition()
  const [notifications, setNotifications] = useState(initialNotifications)
  const [unread, setUnread] = useState(initialUnread)

  // O layout do servidor pode mandar dados novos (ex.: depois de router.refresh).
  useEffect(() => {
    setNotifications(initialNotifications)
    setUnread(initialUnread)
  }, [initialNotifications, initialUnread])

  const refresh = useCallback(async () => {
    try {
      const next = await getNotificationsAction()
      setNotifications(next.notifications)
      setUnread(next.unread)
    } catch {
      // Falha de rede: mantém o que já está na tela e tenta no próximo ciclo.
    }
  }, [])

  // Sem Realtime no navegador (a sessão fica em cookie httpOnly): consulta o
  // servidor a cada 30 s com a aba visível e ao voltar para ela
  // (visibilitychange já cobre a volta; focus duplicaria a consulta).
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") void refresh()
    }
    const interval = window.setInterval(tick, POLL_MS)
    document.addEventListener("visibilitychange", tick)
    return () => {
      window.clearInterval(interval)
      document.removeEventListener("visibilitychange", tick)
    }
  }, [refresh])

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
                startTransition(async () => {
                  await markAllNotificationsReadAction()
                  await refresh()
                })
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
                startTransition(async () => {
                  await markNotificationReadAction({ id: notification.id })
                  await refresh()
                })
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

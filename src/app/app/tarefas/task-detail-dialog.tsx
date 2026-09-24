"use client"

import Link from "next/link"
import { Clock } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { TaskPriorityBadge, TaskStatusBadge } from "@/components/app/task-bits"
import { EntityAvatar } from "@/components/app/entity-avatar"
import { TaskStatusSelect } from "./task-status-select"
import type { TaskListRow } from "@/server/queries/tasks"

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString("pt-BR") : "—"
}

function DeadlinePill({ date }: { date: string | null }) {
  if (!date) return null
  const due = new Date(`${date}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days = Math.round((due.getTime() - today.getTime()) / 86_400_000)
  const overdue = days < 0
  const urgent = days <= 3
  return (
    <span
      className={
        overdue || urgent
          ? "inline-flex items-center gap-1 rounded-full bg-[#fc5a5a]/12 px-2 py-0.5 text-xs font-medium text-[#e02e2e] dark:text-[#ff6b6b]"
          : "inline-flex items-center gap-1 rounded-full bg-[#ff974a]/15 px-2 py-0.5 text-xs font-medium text-[#b25e00] dark:text-[#ff974a]"
      }
    >
      <Clock className="size-3.5" />
      {overdue ? `${Math.abs(days)}d atrasado` : `${days}d restantes`}
    </span>
  )
}

export function TaskDetailDialog({
  task,
  variant = "card",
}: {
  task: TaskListRow
  variant?: "card" | "row"
}) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <button
            type="button"
            className={
              variant === "card"
                ? "bg-card hover:border-primary/40 w-full rounded-xl border p-3 text-left shadow-sm transition-colors"
                : "hover:bg-muted/40 flex w-full flex-wrap items-center gap-x-5 gap-y-2 px-5 py-4 text-left"
            }
          />
        }
      >
        {variant === "card" ? (
          <span className="block space-y-2">
            <span className="font-heading block text-sm font-semibold">
              {task.name}
            </span>
            <span className="text-muted-foreground block text-xs">
              {task.project?.name ?? "—"}
            </span>
            <span className="flex items-center justify-between gap-2">
              <DeadlinePill date={task.due_date} />
              <EntityAvatar
                name={task.assignee_name}
                className="size-7 rounded-full text-[10px]"
              />
            </span>
          </span>
        ) : (
          <span className="flex w-full flex-wrap items-center gap-x-5 gap-y-2">
            <span className="min-w-[180px] flex-1">
              <span className="block text-sm font-medium">{task.name}</span>
              <span className="text-muted-foreground block text-xs">
                {task.project?.name ?? "—"}
              </span>
            </span>
            <span className="text-muted-foreground text-xs">
              {task.assignee_name ?? "Sem responsável"}
            </span>
            <TaskPriorityBadge priority={task.priority} />
            <DeadlinePill date={task.due_date} />
            <TaskStatusBadge status={task.status} />
          </span>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg">{task.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <TaskStatusBadge status={task.status} />
            <TaskPriorityBadge priority={task.priority} />
          </div>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground text-xs">Projeto</dt>
              <dd>{task.project?.name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Responsável</dt>
              <dd>{task.assignee_name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Início</dt>
              <dd>{formatDate(task.start_date)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Prazo</dt>
              <dd>{formatDate(task.due_date)}</dd>
            </div>
          </dl>
          {task.description ? (
            <p className="text-muted-foreground text-sm whitespace-pre-wrap">
              {task.description}
            </p>
          ) : null}
          <div className="space-y-1">
            <span className="text-muted-foreground text-xs">
              Alterar status
            </span>
            <TaskStatusSelect id={task.id} status={task.status} />
          </div>
          <Link
            href={`/app/tarefas/${task.id}`}
            className="text-primary inline-block text-sm hover:underline"
          >
            Abrir página completa →
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  )
}

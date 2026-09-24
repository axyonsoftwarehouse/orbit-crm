"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { TASK_STATUSES } from "@/lib/constants"
import { updateTaskStatusAction } from "@/server/actions/tasks"

const fieldClass =
  "border-input bg-background dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3"

export function TaskStatusSelect({
  id,
  status,
}: {
  id: string
  status: number
}) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  return (
    <select
      value={String(status)}
      disabled={isPending}
      onChange={(event) => {
        const next = Number(event.target.value)
        startTransition(async () => {
          await updateTaskStatusAction({ id, status: next })
          router.refresh()
        })
      }}
      className={fieldClass}
    >
      {Object.entries(TASK_STATUSES).map(([value, config]) => (
        <option key={value} value={value}>
          {config.label}
        </option>
      ))}
    </select>
  )
}

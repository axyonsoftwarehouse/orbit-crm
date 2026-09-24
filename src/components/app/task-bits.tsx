import { Badge } from "@/components/ui/badge"
import { TASK_PRIORITIES, TASK_STATUSES } from "@/lib/constants"

export function TaskStatusBadge({ status }: { status: number }) {
  const config = TASK_STATUSES[status as keyof typeof TASK_STATUSES]
  if (!config) return null

  return (
    <Badge variant="secondary" className="gap-1.5">
      <span
        className="size-2 rounded-full"
        style={{ backgroundColor: config.color }}
      />
      {config.label}
    </Badge>
  )
}

export function TaskPriorityBadge({ priority }: { priority: number }) {
  const config = TASK_PRIORITIES[priority as keyof typeof TASK_PRIORITIES]
  if (!config) return null

  return (
    <Badge variant="secondary" className="gap-1.5">
      <span
        className="size-2 rounded-full"
        style={{ backgroundColor: config.color }}
      />
      {config.label}
    </Badge>
  )
}

import { Badge } from "@/components/ui/badge"
import {
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  TICKET_TYPES,
} from "@/lib/constants"

export function TicketStatusBadge({ status }: { status: number }) {
  const config = TICKET_STATUSES[status as keyof typeof TICKET_STATUSES]
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

export function TicketPriorityBadge({ priority }: { priority: number }) {
  const config = TICKET_PRIORITIES[priority as keyof typeof TICKET_PRIORITIES]
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

export function TicketTypeBadge({ type }: { type: number }) {
  const config = TICKET_TYPES[type as keyof typeof TICKET_TYPES]
  if (!config) return null
  return <Badge variant="outline">{config.label}</Badge>
}

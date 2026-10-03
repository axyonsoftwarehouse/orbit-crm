import { Badge } from "@/components/ui/badge"
import { MILESTONE_STATUSES, type MilestoneStatus } from "@/lib/constants"

export function MilestoneStatusBadge({ status }: { status: number }) {
  const config = MILESTONE_STATUSES[status as MilestoneStatus]
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

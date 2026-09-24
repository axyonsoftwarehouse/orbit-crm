import { Badge } from "@/components/ui/badge"
import { PROJECT_STATUSES, type ProjectStatus } from "@/lib/constants"

export function ProjectStatusBadge({ status }: { status: number }) {
  const config = PROJECT_STATUSES[status as ProjectStatus]
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

export function ProgressBar({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div className="flex items-center gap-2">
      <div className="bg-muted h-2 w-24 overflow-hidden rounded-full">
        <div
          className="bg-primary h-full rounded-full"
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="text-muted-foreground text-xs">{clamped}%</span>
    </div>
  )
}

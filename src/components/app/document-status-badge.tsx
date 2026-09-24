import { Badge } from "@/components/ui/badge"
import {
  ESTIMATE_STATUSES,
  INVOICE_STATUSES,
  type EstimateStatus,
  type InvoiceStatus,
} from "@/lib/constants"

function StatusPill({ label, color }: { label: string; color: string }) {
  return (
    <Badge variant="secondary" className="gap-1.5">
      <span
        className="size-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </Badge>
  )
}

export function EstimateStatusBadge({ status }: { status: number }) {
  const config = ESTIMATE_STATUSES[status as EstimateStatus]
  if (!config) return null
  return <StatusPill label={config.label} color={config.color} />
}

export function InvoiceStatusBadge({
  status,
  dueDate,
}: {
  status: number
  dueDate: string | null
}) {
  const isOverdue =
    (status === 1 || status === 3) &&
    dueDate !== null &&
    new Date(dueDate) < new Date(new Date().toDateString())

  if (isOverdue) {
    return <StatusPill label="Vencida" color="#ef4444" />
  }

  const config = INVOICE_STATUSES[status as InvoiceStatus]
  if (!config) return null
  return <StatusPill label={config.label} color={config.color} />
}

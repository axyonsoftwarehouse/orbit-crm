import { Badge } from "@/components/ui/badge"
import { CONTRACT_STATUSES, type ContractStatus } from "@/lib/constants"

export function ContractStatusBadge({
  status,
  endDate,
}: {
  status: number
  endDate: string | null
}) {
  const config = CONTRACT_STATUSES[status as ContractStatus]
  if (!config) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expired =
    status === 1 &&
    endDate !== null &&
    new Date(`${endDate}T00:00:00`).getTime() < today.getTime()

  return (
    <Badge variant="secondary" className="gap-1.5">
      <span
        className="size-2 rounded-full"
        style={{ backgroundColor: expired ? "#f59e0b" : config.color }}
      />
      {expired ? "Vencido" : config.label}
    </Badge>
  )
}

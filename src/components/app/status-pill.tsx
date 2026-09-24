import { Badge } from "@/components/ui/badge"

export function StatusPill({ name, color }: { name: string; color: string }) {
  return (
    <Badge variant="secondary" className="gap-1.5">
      <span
        className="size-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      {name}
    </Badge>
  )
}

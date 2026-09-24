import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const TONES = {
  primary: "bg-primary/10 text-primary",
  green: "bg-[#3dd598]/15 text-[#12a06b] dark:text-[#3dd598]",
  blue: "bg-[#50b5ff]/15 text-[#0e7ac4] dark:text-[#50b5ff]",
  yellow: "bg-[#ffc542]/20 text-[#b98300] dark:text-[#ffc542]",
  red: "bg-[#fc5a5a]/12 text-[#e02e2e] dark:text-[#ff6b6b]",
} as const

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "primary",
}: {
  label: string
  value: string
  icon: LucideIcon
  tone?: keyof typeof TONES
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <div
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-2xl",
            TONES[tone],
          )}
        >
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <div className="font-heading truncate text-2xl font-semibold">
            {value}
          </div>
          <div className="text-muted-foreground truncate text-sm">{label}</div>
        </div>
      </CardContent>
    </Card>
  )
}

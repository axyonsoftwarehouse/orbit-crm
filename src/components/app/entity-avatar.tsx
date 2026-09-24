import { cn } from "@/lib/utils"
import { colorFor, initialsOf } from "@/lib/avatar"

export function EntityAvatar({
  name,
  className,
}: {
  name: string | null
  className?: string
}) {
  return (
    <span
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold text-white",
        className,
      )}
      style={{ backgroundColor: colorFor(name) }}
    >
      {initialsOf(name)}
    </span>
  )
}

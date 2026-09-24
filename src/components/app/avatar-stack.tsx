import { cn } from "@/lib/utils"
import { colorFor, initialsOf } from "@/lib/avatar"

export function AvatarStack({
  people,
  max = 4,
}: {
  people: { user_id: string; full_name: string | null }[]
  max?: number
}) {
  if (people.length === 0) return null

  const shown = people.slice(0, max)
  const extra = people.length - shown.length

  return (
    <div className="flex items-center">
      {shown.map((person, index) => (
        <span
          key={person.user_id}
          title={person.full_name ?? ""}
          className={cn(
            "ring-card flex size-8 items-center justify-center rounded-full text-[11px] font-semibold text-white ring-2",
            index > 0 && "-ml-2",
          )}
          style={{ backgroundColor: colorFor(person.full_name) }}
        >
          {initialsOf(person.full_name)}
        </span>
      ))}
      {extra > 0 ? (
        <span className="bg-muted text-muted-foreground ring-card -ml-2 flex size-8 items-center justify-center rounded-full text-[11px] font-medium ring-2">
          +{extra}
        </span>
      ) : null}
    </div>
  )
}

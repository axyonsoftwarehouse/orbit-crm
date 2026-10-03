import Link from "next/link"
import { cn } from "@/lib/utils"
import type { Tag } from "@/server/queries/tags"

export function TagFilter({
  tags,
  active,
  hrefFor,
}: {
  tags: Tag[]
  active?: string
  hrefFor: (tagId: string | null) => string
}) {
  if (tags.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href={hrefFor(null)}
        className={cn(
          "rounded-full border px-3 py-1 text-xs",
          !active
            ? "border-primary bg-primary/10 text-primary"
            : "text-muted-foreground",
        )}
      >
        Todas as tags
      </Link>
      {tags.map((tag) => (
        <Link
          key={tag.id}
          href={hrefFor(tag.id)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs",
            active === tag.id
              ? "border-primary bg-primary/10 text-primary"
              : "text-muted-foreground",
          )}
        >
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: tag.color }}
          />
          {tag.name}
        </Link>
      ))}
    </div>
  )
}

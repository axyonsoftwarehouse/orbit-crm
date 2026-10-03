import Link from "next/link"
import { cn } from "@/lib/utils"
import { PAGE_SIZE } from "@/lib/pagination"

export function Pagination({
  page,
  total,
  pageSize = PAGE_SIZE,
  hrefFor,
}: {
  page: number
  total: number
  pageSize?: number
  hrefFor: (page: number) => string
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (total <= pageSize) return null

  const itemClass =
    "inline-flex h-8 items-center rounded-lg border px-3 text-sm"

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <span className="text-muted-foreground text-xs">
        Página {page} de {totalPages} · {total} registro(s)
      </span>
      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Link href={hrefFor(page - 1)} className={itemClass}>
            Anterior
          </Link>
        ) : (
          <span className={cn(itemClass, "text-muted-foreground opacity-50")}>
            Anterior
          </span>
        )}
        {page < totalPages ? (
          <Link href={hrefFor(page + 1)} className={itemClass}>
            Próxima
          </Link>
        ) : (
          <span className={cn(itemClass, "text-muted-foreground opacity-50")}>
            Próxima
          </span>
        )}
      </div>
    </div>
  )
}

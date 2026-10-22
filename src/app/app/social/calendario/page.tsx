import Link from "next/link"
import {
  addMonths,
  buildCalendarDays,
  dateKey,
  monthKey,
  monthLabel,
  monthRange,
  parseMonth,
  WEEKDAY_NAMES,
} from "@/lib/social-calendar"
import { SOCIAL_POST_STATUSES, type SocialPostStatus } from "@/lib/constants"
import { getMemberships } from "@/lib/auth"
import { getActiveTenant } from "@/lib/tenant"
import { listCompanies } from "@/server/queries/companies"
import {
  listSocialAccounts,
  listSocialCalendar,
  type SocialPostListRow,
} from "@/server/queries/social"
import { SocialPostFormDialog } from "../social-post-form-dialog"

function time(value: string | null) {
  if (!value) return ""
  return new Date(value).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default async function SocialCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const { month: monthParam } = await searchParams
  const current = parseMonth(monthParam)
  const range = monthRange(current)
  const memberships = await getMemberships()
  const active = await getActiveTenant(memberships)
  if (!active) return null

  const [posts, companies, accounts] = await Promise.all([
    listSocialCalendar(active.tenantId, range.start, range.end),
    listCompanies(active.tenantId),
    listSocialAccounts(active.tenantId),
  ])

  const byDay = new Map<string, SocialPostListRow[]>()
  for (const post of posts) {
    if (!post.scheduled_at) continue
    const key = dateKey(post.scheduled_at)
    const list = byDay.get(key) ?? []
    list.push(post)
    byDay.set(key, list)
  }

  const days = buildCalendarDays(current)
  const previous = addMonths(current, -1)
  const next = addMonths(current, 1)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Calendário</h1>
          <p className="text-muted-foreground text-sm">
            {posts.length} post(s) agendado(s) em {monthLabel(current)}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/app/social"
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            Lista
          </Link>
          <SocialPostFormDialog
            companies={companies.map((company) => ({
              id: company.id,
              name: company.name,
            }))}
            accounts={accounts}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Link
            href={`/app/social/calendario?month=${monthKey(previous)}`}
            className="hover:bg-muted rounded-lg border px-3 py-1.5 text-sm"
          >
            Anterior
          </Link>
          <Link
            href={`/app/social/calendario?month=${monthKey(next)}`}
            className="hover:bg-muted rounded-lg border px-3 py-1.5 text-sm"
          >
            Próximo
          </Link>
          <Link
            href="/app/social/calendario"
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            Hoje
          </Link>
        </div>
        <p className="font-heading text-sm font-semibold capitalize">
          {monthLabel(current)}
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border">
        <div className="grid min-w-[700px] grid-cols-7">
          {WEEKDAY_NAMES.map((weekday) => (
            <div
              key={weekday}
              className="bg-muted/40 text-muted-foreground border-b px-2 py-2 text-center text-xs font-medium"
            >
              {weekday}
            </div>
          ))}
          {days.map((day) => {
            const dayPosts = byDay.get(day.key) ?? []
            return (
              <div
                key={day.key}
                className={
                  day.inMonth
                    ? "min-h-28 border-r border-b p-2 last:border-r-0"
                    : "bg-muted/20 text-muted-foreground min-h-28 border-r border-b p-2 last:border-r-0"
                }
              >
                <div className="mb-1 text-xs font-medium">{day.day}</div>
                <div className="space-y-1">
                  {dayPosts.slice(0, 4).map((post) => {
                    const config =
                      SOCIAL_POST_STATUSES[post.status as SocialPostStatus] ??
                      SOCIAL_POST_STATUSES.draft
                    return (
                      <Link
                        key={post.id}
                        href={`/app/social/${post.id}`}
                        className="hover:bg-muted block rounded-md border px-1.5 py-1"
                        title={post.content}
                      >
                        <div className="flex items-center gap-1">
                          <span
                            className="size-1.5 shrink-0 rounded-full"
                            style={{ backgroundColor: config.color }}
                          />
                          <span className="truncate text-[11px] font-medium">
                            {time(post.scheduled_at)} · {post.content}
                          </span>
                        </div>
                        <div className="text-muted-foreground mt-0.5 truncate text-[10px]">
                          {post.company?.name ?? "Sem cliente"} ·{" "}
                          {post.targets
                            .map((target) => target.provider)
                            .join(", ")}
                        </div>
                      </Link>
                    )
                  })}
                  {dayPosts.length > 4 ? (
                    <p className="text-muted-foreground text-[10px]">
                      +{dayPosts.length - 4} post(s)
                    </p>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

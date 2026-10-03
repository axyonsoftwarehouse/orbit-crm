import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { getMemberships } from "@/lib/auth"
import { getActiveTenant } from "@/lib/tenant"
import { listCompanies } from "@/server/queries/companies"
import { listProjects } from "@/server/queries/projects"
import {
  listCalendarItems,
  listMonthEvents,
  type CalendarItem,
} from "@/server/queries/calendar"
import { EventFormDialog } from "./event-form-dialog"
import { DeleteEventButton } from "./delete-event-button"

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

function ymd(date: Date) {
  return date.toLocaleDateString("en-CA")
}

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const { month } = await searchParams
  const now = new Date()
  const fallback = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  const [year, m] = (month ?? fallback).split("-").map(Number)

  const firstDay = new Date(year, m - 1, 1)
  const lastDay = new Date(year, m, 0)
  const gridStart = new Date(firstDay)
  gridStart.setDate(firstDay.getDate() - firstDay.getDay())
  const gridEnd = new Date(lastDay)
  gridEnd.setDate(lastDay.getDate() + (6 - lastDay.getDay()))

  const memberships = await getMemberships()
  const active = await getActiveTenant(memberships)
  if (!active) return null

  const [items, events, companies, projects] = await Promise.all([
    listCalendarItems(active.tenantId, ymd(gridStart), ymd(gridEnd)),
    listMonthEvents(active.tenantId, ymd(firstDay), ymd(lastDay)),
    listCompanies(active.tenantId),
    listProjects(active.tenantId),
  ])

  const itemsByDate = new Map<string, CalendarItem[]>()
  for (const item of items) {
    const list = itemsByDate.get(item.date) ?? []
    list.push(item)
    itemsByDate.set(item.date, list)
  }

  const days: Date[] = []
  for (
    let day = new Date(gridStart);
    day <= gridEnd;
    day.setDate(day.getDate() + 1)
  ) {
    days.push(new Date(day))
  }

  const todayYmd = ymd(now)
  const monthLabel = firstDay.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  })
  const prevMonth =
    m === 1 ? `${year - 1}-12` : `${year}-${String(m - 1).padStart(2, "0")}`
  const nextMonth =
    m === 12 ? `${year + 1}-01` : `${year}-${String(m + 1).padStart(2, "0")}`

  const companyOptions = companies.map((item) => ({
    id: item.id,
    name: item.name,
  }))
  const projectOptions = projects.map((item) => ({
    id: item.id,
    name: item.name,
  }))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Calendário</h1>
          <p className="text-muted-foreground text-sm">
            Eventos, prazos de tarefas, faturas e contratos.
          </p>
        </div>
        <EventFormDialog
          companies={companyOptions}
          projects={projectOptions}
          label="Novo evento"
        />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base capitalize">{monthLabel}</CardTitle>
          <div className="flex items-center gap-1">
            <Link
              href={`/app/calendario?month=${prevMonth}`}
              className="hover:bg-muted flex size-8 items-center justify-center rounded-lg"
              aria-label="Mês anterior"
            >
              <ChevronLeft className="size-4" />
            </Link>
            <Link
              href="/app/calendario"
              className="text-muted-foreground px-2 text-xs hover:underline"
            >
              Hoje
            </Link>
            <Link
              href={`/app/calendario?month=${nextMonth}`}
              className="hover:bg-muted flex size-8 items-center justify-center rounded-lg"
              aria-label="Próximo mês"
            >
              <ChevronRight className="size-4" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <div className="grid grid-cols-7 border-b">
            {WEEKDAYS.map((weekday) => (
              <div
                key={weekday}
                className="text-muted-foreground p-2 text-center text-xs font-medium"
              >
                {weekday}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day) => {
              const key = ymd(day)
              const inMonth = day.getMonth() === m - 1
              const dayItems = itemsByDate.get(key) ?? []
              return (
                <div
                  key={key}
                  className={cn(
                    "min-h-24 border-r border-b p-1.5",
                    !inMonth && "bg-muted/30",
                  )}
                >
                  <div
                    className={cn(
                      "mb-1 text-xs",
                      key === todayYmd
                        ? "text-primary font-semibold"
                        : "text-muted-foreground",
                    )}
                  >
                    {day.getDate()}
                  </div>
                  <div className="space-y-1">
                    {dayItems.slice(0, 4).map((item) => {
                      const chip = (
                        <span
                          className="flex items-center gap-1 truncate rounded px-1 py-0.5 text-[10px]"
                          style={{
                            backgroundColor: `${item.color}1a`,
                            color: item.color,
                          }}
                        >
                          <span
                            className="size-1.5 shrink-0 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="truncate">
                            {item.time ? `${item.time} ` : ""}
                            {item.title}
                          </span>
                        </span>
                      )
                      return item.href ? (
                        <Link
                          key={item.id}
                          href={item.href}
                          title={item.title}
                          className="block"
                        >
                          {chip}
                        </Link>
                      ) : (
                        <div key={item.id} title={item.title}>
                          {chip}
                        </div>
                      )
                    })}
                    {dayItems.length > 4 ? (
                      <span className="text-muted-foreground text-[10px]">
                        +{dayItems.length - 4}
                      </span>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Eventos do mês</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {events.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Nenhum evento neste mês.
            </p>
          ) : (
            events.map((event) => (
              <div
                key={event.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b pb-2 last:border-0 last:pb-0"
              >
                <div>
                  <p className="text-sm font-medium">{event.title}</p>
                  <p className="text-muted-foreground text-xs">
                    {new Date(event.start_at).toLocaleString("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <EventFormDialog
                    event={event}
                    companies={companyOptions}
                    projects={projectOptions}
                    label="Editar"
                  />
                  <DeleteEventButton id={event.id} />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

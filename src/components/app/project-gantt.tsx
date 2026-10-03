import Link from "next/link"
import { TASK_STATUSES } from "@/lib/constants"

type GanttTask = {
  id: string
  name: string
  status: number
  start_date: string | null
  due_date: string | null
}

type GanttMilestone = {
  id: string
  name: string
  color: string
  start_date: string | null
  due_date: string | null
}

const DAY = 24 * 60 * 60 * 1000
const MONTHS = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
]

function parseDate(value: string) {
  return new Date(`${value}T00:00:00`)
}

type Item = {
  key: string
  label: string
  kind: "task" | "milestone"
  start: string
  end: string
  color: string
  href?: string
}

type RawItem = {
  key: string
  label: string
  kind: "task" | "milestone"
  color: string
  href?: string
  start: string | null
  end: string | null
}

function buildItems(tasks: GanttTask[], milestones: GanttMilestone[]): Item[] {
  const raw: RawItem[] = [
    ...tasks.map((task) => ({
      key: `task-${task.id}`,
      label: task.name,
      kind: "task" as const,
      color:
        TASK_STATUSES[task.status as keyof typeof TASK_STATUSES]?.color ??
        "#0062FF",
      href: `/app/tarefas/${task.id}`,
      start: task.start_date ?? task.due_date,
      end: task.due_date ?? task.start_date,
    })),
    ...milestones.map((milestone) => ({
      key: `milestone-${milestone.id}`,
      label: milestone.name,
      kind: "milestone" as const,
      color: milestone.color,
      start: milestone.start_date ?? milestone.due_date,
      end: milestone.due_date ?? milestone.start_date,
    })),
  ]

  return raw.filter(
    (item): item is Item => item.start !== null && item.end !== null,
  )
}

export function ProjectGantt({
  tasks,
  milestones,
  projectStart,
  projectDeadline,
}: {
  tasks: GanttTask[]
  milestones: GanttMilestone[]
  projectStart: string | null
  projectDeadline: string | null
}) {
  const items = buildItems(tasks, milestones)

  if (items.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Defina datas nas tarefas ou marcos para visualizar o cronograma.
      </p>
    )
  }

  const bounds = items.flatMap((item) => [item.start, item.end])
  if (projectStart) bounds.push(projectStart)
  if (projectDeadline) bounds.push(projectDeadline)

  const times = bounds.map((value) => parseDate(value).getTime())
  const min = Math.min(...times)
  let max = Math.max(...times)
  if (max <= min) max = min + DAY
  const span = max - min

  const leftOf = (value: string) =>
    ((parseDate(value).getTime() - min) / span) * 100
  const widthOf = (start: string, end: string) =>
    Math.max(
      ((parseDate(end).getTime() - parseDate(start).getTime()) / span) * 100,
      1.2,
    )

  const months: { key: string; label: string; left: number; width: number }[] =
    []
  const cursor = new Date(min)
  cursor.setDate(1)
  while (cursor.getTime() <= max) {
    const monthStart = cursor.getTime()
    const nextMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)
    const start = Math.max(monthStart, min)
    const end = Math.min(nextMonth.getTime(), max)
    months.push({
      key: `${monthStart}`,
      label: `${MONTHS[new Date(monthStart).getMonth()]}/${String(
        new Date(monthStart).getFullYear(),
      ).slice(2)}`,
      left: ((start - min) / span) * 100,
      width: ((end - start) / span) * 100,
    })
    cursor.setMonth(cursor.getMonth() + 1)
  }

  const today = parseDate(new Date().toISOString().slice(0, 10)).getTime()
  const todayLeft =
    today >= min && today <= max ? ((today - min) / span) * 100 : null

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        <div className="flex border-b pb-1">
          <div className="w-44 shrink-0" />
          <div className="relative h-5 flex-1">
            {months.map((month) => (
              <div
                key={month.key}
                className="text-muted-foreground border-border absolute top-0 border-l pl-1 text-[10px] whitespace-nowrap"
                style={{ left: `${month.left}%`, width: `${month.width}%` }}
              >
                {month.label}
              </div>
            ))}
          </div>
        </div>
        <div className="divide-y">
          {items.map((item) => (
            <div key={item.key} className="flex items-center">
              <div
                className="w-44 shrink-0 truncate py-2 pr-2 text-sm"
                title={item.label}
              >
                {item.kind === "milestone" ? "◆ " : ""}
                {item.label}
              </div>
              <div className="relative h-9 flex-1">
                {todayLeft !== null ? (
                  <div
                    className="bg-destructive/40 absolute top-0 bottom-0 w-px"
                    style={{ left: `${todayLeft}%` }}
                  />
                ) : null}
                {item.kind === "milestone" ? (
                  <span
                    className="absolute top-1/2 size-3 -translate-y-1/2 rotate-45 rounded-[2px]"
                    style={{
                      left: `${leftOf(item.end)}%`,
                      backgroundColor: item.color,
                    }}
                    title={`${item.label} — ${parseDate(
                      item.end,
                    ).toLocaleDateString("pt-BR")}`}
                  />
                ) : (
                  <Link
                    href={item.href ?? "#"}
                    className="absolute top-1/2 h-3 -translate-y-1/2 rounded-full opacity-90 hover:opacity-100"
                    style={{
                      left: `${leftOf(item.start)}%`,
                      width: `${widthOf(item.start, item.end)}%`,
                      backgroundColor: item.color,
                    }}
                    title={`${item.label} — ${parseDate(
                      item.start,
                    ).toLocaleDateString("pt-BR")}`}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

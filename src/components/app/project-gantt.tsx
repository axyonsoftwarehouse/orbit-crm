"use client"

import Link from "next/link"
import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react"
import { toast } from "sonner"
import { TASK_STATUSES } from "@/lib/constants"
import { addDays } from "@/lib/gantt"
import { updateTaskScheduleAction } from "@/server/actions/gantt"
import { GanttDependencyDialog } from "@/components/app/gantt-dependency-dialog"

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

type GanttDependency = {
  id: string
  task_id: string
  depends_on_task_id: string
}

const DAY = 24 * 60 * 60 * 1000
const ROW_H = 36
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
  taskId: string | null
  label: string
  kind: "task" | "milestone"
  color: string
  start: string
  end: string
}

type DragMode = "move" | "start" | "end"

type DragState = {
  id: string
  mode: DragMode
  startX: number
  origStart: string
  origEnd: string
  delta: number
}

export function ProjectGantt({
  projectId,
  tasks,
  milestones,
  dependencies,
  projectStart,
  projectDeadline,
  canEdit = true,
}: {
  projectId: string
  tasks: GanttTask[]
  milestones: GanttMilestone[]
  dependencies: GanttDependency[]
  projectStart: string | null
  projectDeadline: string | null
  canEdit?: boolean
}) {
  const [draft, setDraft] = useState<
    Record<string, { start: string; end: string }>
  >({})
  const [dragging, setDragging] = useState(false)
  const [chartWidth, setChartWidth] = useState(0)
  const dragRef = useRef<DragState | null>(null)
  const movedRef = useRef(false)
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setDraft({})
  }, [tasks])

  useEffect(() => {
    const el = chartRef.current
    if (!el) return
    const update = () => setChartWidth(el.clientWidth)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const items: Item[] = [
    ...tasks.map((task) => {
      const override = draft[task.id]
      return {
        key: `task-${task.id}`,
        taskId: task.id,
        label: task.name,
        kind: "task" as const,
        color:
          TASK_STATUSES[task.status as keyof typeof TASK_STATUSES]?.color ??
          "#0062FF",
        start: override?.start ?? task.start_date ?? task.due_date ?? "",
        end: override?.end ?? task.due_date ?? task.start_date ?? "",
      }
    }),
    ...milestones.map((milestone) => ({
      key: `milestone-${milestone.id}`,
      taskId: null,
      label: milestone.name,
      kind: "milestone" as const,
      color: milestone.color,
      start: milestone.start_date ?? milestone.due_date ?? "",
      end: milestone.due_date ?? milestone.start_date ?? "",
    })),
  ].filter((item) => item.start !== "" && item.end !== "")

  const bounds = items.flatMap((item) => [item.start, item.end])
  if (projectStart) bounds.push(projectStart)
  if (projectDeadline) bounds.push(projectDeadline)

  const times = bounds.map((value) => parseDate(value).getTime())
  const min = Math.min(...times)
  let max = Math.max(...times)
  if (max <= min) max = min + DAY
  const span = max - min
  const totalDays = Math.max(1, span / DAY)
  const pxPerDay = chartWidth > 0 ? chartWidth / totalDays : 0

  const leftPct = (value: string) =>
    ((parseDate(value).getTime() - min) / span) * 100
  const leftPx = (value: string) => (leftPct(value) / 100) * chartWidth
  const widthPct = (start: string, end: string) =>
    Math.max(
      ((parseDate(end).getTime() - parseDate(start).getTime()) / span) * 100,
      1.2,
    )

  const months: { key: string; label: string; left: number; width: number }[] =
    []
  if (items.length > 0) {
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
  }

  const today = parseDate(new Date().toISOString().slice(0, 10)).getTime()
  const todayLeft =
    today >= min && today <= max ? ((today - min) / span) * 100 : null

  const indexByTaskId = new Map<string, number>()
  items.forEach((item, index) => {
    if (item.taskId) indexByTaskId.set(item.taskId, index)
  })

  function beginDrag(event: ReactPointerEvent, item: Item, mode: DragMode) {
    if (!canEdit || !item.taskId || pxPerDay === 0) return
    event.preventDefault()
    event.stopPropagation()
    movedRef.current = false
    dragRef.current = {
      id: item.taskId,
      mode,
      startX: event.clientX,
      origStart: item.start,
      origEnd: item.end,
      delta: 0,
    }
    setDragging(true)
    setDraft((prev) => ({
      ...prev,
      [item.taskId as string]: { start: item.start, end: item.end },
    }))
  }

  useEffect(() => {
    if (!dragging) return

    const handleMove = (event: PointerEvent) => {
      const drag = dragRef.current
      if (!drag) return
      const delta = Math.round((event.clientX - drag.startX) / pxPerDay)
      if (delta !== drag.delta) {
        drag.delta = delta
        movedRef.current = true
        let start = drag.origStart
        let end = drag.origEnd
        if (drag.mode === "move") {
          start = addDays(drag.origStart, delta)
          end = addDays(drag.origEnd, delta)
        } else if (drag.mode === "start") {
          start = addDays(drag.origStart, delta)
          if (start > end) start = end
        } else {
          end = addDays(drag.origEnd, delta)
          if (end < start) end = start
        }
        setDraft((prev) => ({ ...prev, [drag.id]: { start, end } }))
      }
    }

    const handleUp = () => {
      const drag = dragRef.current
      dragRef.current = null
      setDragging(false)
      if (!drag || drag.delta === 0) return

      let start = drag.origStart
      let end = drag.origEnd
      if (drag.mode === "move") {
        start = addDays(drag.origStart, drag.delta)
        end = addDays(drag.origEnd, drag.delta)
      } else if (drag.mode === "start") {
        start = addDays(drag.origStart, drag.delta)
        if (start > end) start = end
      } else {
        end = addDays(drag.origEnd, drag.delta)
        if (end < start) end = start
      }

      void (async () => {
        const result = await updateTaskScheduleAction({
          id: drag.id,
          projectId,
          start_date: start,
          due_date: end,
        })
        if (result?.error) {
          toast.error(result.error)
          setDraft((prev) => {
            const next = { ...prev }
            delete next[drag.id]
            return next
          })
        }
      })()
    }

    window.addEventListener("pointermove", handleMove)
    window.addEventListener("pointerup", handleUp)
    return () => {
      window.removeEventListener("pointermove", handleMove)
      window.removeEventListener("pointerup", handleUp)
    }
  }, [dragging, pxPerDay, projectId])

  if (items.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Defina datas nas tarefas ou marcos para visualizar o cronograma.
      </p>
    )
  }

  const taskOptions = tasks.map((task) => ({ id: task.id, name: task.name }))

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

        <div className="flex">
          <div className="w-44 shrink-0 divide-y border-r">
            {items.map((item) => (
              <div
                key={item.key}
                className="flex h-9 items-center gap-1 truncate pr-2 text-sm"
                title={item.label}
              >
                <span className="truncate">
                  {item.kind === "milestone" ? "◆ " : ""}
                  {item.label}
                </span>
                {canEdit && item.taskId ? (
                  <span className="ml-auto shrink-0">
                    <GanttDependencyDialog
                      projectId={projectId}
                      task={{ id: item.taskId, name: item.label }}
                      tasks={taskOptions}
                      dependencies={dependencies}
                    />
                  </span>
                ) : null}
              </div>
            ))}
          </div>

          <div ref={chartRef} className="relative flex-1">
            {todayLeft !== null ? (
              <div
                className="bg-destructive/40 absolute top-0 bottom-0 z-0 w-px"
                style={{ left: `${todayLeft}%` }}
              />
            ) : null}

            {chartWidth > 0 && dependencies.length > 0 ? (
              <svg
                className="pointer-events-none absolute top-0 left-0 z-10"
                width={chartWidth}
                height={items.length * ROW_H}
              >
                <defs>
                  <marker
                    id="gantt-arrow"
                    markerWidth="6"
                    markerHeight="6"
                    refX="5"
                    refY="3"
                    orient="auto"
                  >
                    <path d="M0,0 L6,3 L0,6 Z" fill="#94a3b8" />
                  </marker>
                </defs>
                {dependencies.map((dep) => {
                  const fromIndex = indexByTaskId.get(dep.depends_on_task_id)
                  const toIndex = indexByTaskId.get(dep.task_id)
                  if (fromIndex === undefined || toIndex === undefined) {
                    return null
                  }
                  const from = items[fromIndex]
                  const to = items[toIndex]
                  const x1 = leftPx(from.end)
                  const y1 = fromIndex * ROW_H + ROW_H / 2
                  const x2 = leftPx(to.start)
                  const y2 = toIndex * ROW_H + ROW_H / 2
                  const midX = x2 > x1 + 16 ? x1 + 12 : x1 + 16
                  return (
                    <path
                      key={dep.id}
                      d={`M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`}
                      fill="none"
                      stroke="#94a3b8"
                      strokeWidth={1.5}
                      markerEnd="url(#gantt-arrow)"
                    />
                  )
                })}
              </svg>
            ) : null}

            <div className="relative z-20">
              {items.map((item) => (
                <div
                  key={item.key}
                  className="border-border/60 relative h-9 border-b"
                >
                  {item.kind === "milestone" ? (
                    <span
                      className="absolute top-1/2 size-3 -translate-y-1/2 rotate-45 rounded-[2px]"
                      style={{
                        left: `calc(${leftPct(item.end)}% - 6px)`,
                        backgroundColor: item.color,
                      }}
                      title={`${item.label} — ${parseDate(
                        item.end,
                      ).toLocaleDateString("pt-BR")}`}
                    />
                  ) : (
                    <div
                      className="absolute top-1/2 h-3 -translate-y-1/2"
                      style={{
                        left: `${leftPct(item.start)}%`,
                        width: `${widthPct(item.start, item.end)}%`,
                      }}
                    >
                      {canEdit ? (
                        <span
                          onPointerDown={(event) =>
                            beginDrag(event, item, "start")
                          }
                          className="absolute top-1/2 -left-1 z-20 h-4 w-2 -translate-y-1/2 cursor-ew-resize"
                          title="Ajustar início"
                        />
                      ) : null}
                      {canEdit ? (
                        <span
                          onPointerDown={(event) =>
                            beginDrag(event, item, "end")
                          }
                          className="absolute top-1/2 -right-1 z-20 h-4 w-2 -translate-y-1/2 cursor-ew-resize"
                          title="Ajustar término"
                        />
                      ) : null}
                      <Link
                        href={`/app/tarefas/${item.taskId}`}
                        onPointerDown={
                          canEdit
                            ? (event) => beginDrag(event, item, "move")
                            : undefined
                        }
                        onClick={(event) => {
                          if (movedRef.current) {
                            event.preventDefault()
                            movedRef.current = false
                          }
                        }}
                        className={
                          "block h-full w-full rounded-full opacity-90 hover:opacity-100 " +
                          (canEdit ? "cursor-grab active:cursor-grabbing" : "")
                        }
                        style={{ backgroundColor: item.color }}
                        title={`${item.label} — ${parseDate(
                          item.start,
                        ).toLocaleDateString("pt-BR")}`}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useEffect, useMemo, useState } from "react"
import { Play, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { startTimerAction, stopTimerAction } from "@/server/actions/time"

const fieldClass =
  "border-input bg-background dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3"

type Running = {
  id: string
  started_at: string
  project_name: string | null
  task_name: string | null
} | null

function formatElapsed(seconds: number) {
  const hours = Math.floor(seconds / 3600)
    .toString()
    .padStart(2, "0")
  const minutes = Math.floor((seconds % 3600) / 60)
    .toString()
    .padStart(2, "0")
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0")
  return `${hours}:${minutes}:${secs}`
}

export function TimerWidget({
  running,
  projects,
  tasks,
}: {
  running: Running
  projects: { id: string; name: string }[]
  tasks: { id: string; name: string; project_id: string }[]
}) {
  const [elapsed, setElapsed] = useState(0)
  const [projectId, setProjectId] = useState("")

  useEffect(() => {
    if (!running) return
    const start = new Date(running.started_at).getTime()
    const tick = () =>
      setElapsed(Math.max(0, Math.round((Date.now() - start) / 1000)))
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [running])

  const filteredTasks = useMemo(
    () => tasks.filter((task) => task.project_id === projectId),
    [tasks, projectId],
  )

  if (running) {
    return (
      <div className="bg-card flex items-center gap-4 rounded-lg border px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">
            {running.project_name ?? "Projeto"}
            {running.task_name ? ` · ${running.task_name}` : ""}
          </div>
          <div className="text-muted-foreground text-xs">Em andamento</div>
        </div>
        <span className="font-mono text-lg tabular-nums">
          {formatElapsed(elapsed)}
        </span>
        <form action={stopTimerAction}>
          <input type="hidden" name="id" value={running.id} />
          <Button type="submit" variant="destructive" size="sm">
            <Square className="size-4" />
            Parar
          </Button>
        </form>
      </div>
    )
  }

  return (
    <form
      action={startTimerAction}
      className="bg-card flex flex-col gap-3 rounded-lg border px-4 py-3 sm:flex-row sm:items-center"
    >
      <select
        name="project_id"
        required
        value={projectId}
        onChange={(event) => setProjectId(event.target.value)}
        className={`${fieldClass} sm:max-w-52`}
      >
        <option value="" disabled>
          Projeto…
        </option>
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.name}
          </option>
        ))}
      </select>

      <select
        name="task_id"
        className={`${fieldClass} sm:max-w-52`}
        defaultValue=""
      >
        <option value="">Sem tarefa</option>
        {filteredTasks.map((task) => (
          <option key={task.id} value={task.id}>
            {task.name}
          </option>
        ))}
      </select>

      <input
        name="note"
        placeholder="Nota (opcional)"
        className={`${fieldClass} flex-1`}
      />

      <label className="flex items-center gap-2 text-sm whitespace-nowrap">
        <input
          type="checkbox"
          name="is_billable"
          className="accent-primary size-4"
        />
        Faturável
      </label>

      <Button type="submit">
        <Play className="size-4" />
        Iniciar
      </Button>
    </form>
  )
}

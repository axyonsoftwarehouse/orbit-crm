import { TimeEntriesTable } from "@/components/app/time-entries-table"
import { getUser, getMemberships } from "@/lib/auth"
import { getActiveTenant } from "@/lib/tenant"
import { listProjects } from "@/server/queries/projects"
import { listTasks } from "@/server/queries/tasks"
import { getRunningEntry } from "@/server/queries/time"
import { ManualEntryDialog } from "./manual-entry-dialog"
import { TimerWidget } from "./timer-widget"

export default async function TimesheetPage() {
  const memberships = await getMemberships()
  const active = await getActiveTenant(memberships)
  if (!active) return null

  const user = await getUser()
  const [projects, tasks, running] = await Promise.all([
    listProjects(active.tenantId),
    listTasks(active.tenantId),
    user ? getRunningEntry(active.tenantId, user.id) : Promise.resolve(null),
  ])

  const projectOptions = projects.map((project) => ({
    id: project.id,
    name: project.name,
  }))
  const taskOptions = tasks.map((task) => ({
    id: task.id,
    name: task.name,
    project_id: task.project?.id ?? "",
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Timesheet</h1>
          <p className="text-muted-foreground text-sm">
            Registre horas com o timer ou manualmente.
          </p>
        </div>
        <ManualEntryDialog projects={projectOptions} tasks={taskOptions} />
      </div>

      <TimerWidget
        running={running}
        projects={projectOptions}
        tasks={taskOptions}
      />

      <TimeEntriesTable tenantId={active.tenantId} showUser />
    </div>
  )
}

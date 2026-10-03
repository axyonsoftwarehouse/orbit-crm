import Link from "next/link"
import { getMemberships } from "@/lib/auth"
import { getActiveTenant } from "@/lib/tenant"
import { TASK_STATUSES } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { TagFilter } from "@/components/app/tag-filter"
import { Pagination } from "@/components/app/pagination"
import { PAGE_SIZE, parsePage } from "@/lib/pagination"
import { listProjects, listTenantMembers } from "@/server/queries/projects"
import { listMilestoneOptions } from "@/server/queries/milestones"
import { entityIdsByTag, listTags } from "@/server/queries/tags"
import { listCustomFieldDefinitions } from "@/server/queries/custom-fields"
import {
  listTasks,
  listTasksPage,
  type TaskListRow,
} from "@/server/queries/tasks"
import { TaskFormDialog } from "./task-form-dialog"
import { TaskDetailDialog } from "./task-detail-dialog"

function KanbanBoard({ tasks }: { tasks: TaskListRow[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {Object.entries(TASK_STATUSES).map(([key, config]) => {
        const status = Number(key)
        const items = tasks.filter((task) => task.status === status)
        return (
          <div
            key={key}
            className="bg-muted/40 flex flex-col gap-3 rounded-2xl p-3"
          >
            <div className="flex items-center justify-between px-1">
              <span className="font-heading text-sm font-semibold">
                {config.label}
              </span>
              <span className="text-muted-foreground text-xs">
                {items.length}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {items.map((task) => (
                <TaskDetailDialog key={task.id} task={task} variant="card" />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function TaskList({ tasks }: { tasks: TaskListRow[] }) {
  const statuses = Object.entries(TASK_STATUSES)

  return (
    <div className="space-y-6">
      {statuses.map(([key, config]) => {
        const status = Number(key)
        const items = tasks.filter((task) => task.status === status)
        if (items.length === 0) return null
        return (
          <section
            key={key}
            className="bg-card overflow-hidden rounded-2xl border shadow-[0_6px_24px_-14px_rgba(23,23,37,0.18)] dark:shadow-none"
          >
            <div className="flex items-center justify-between border-b px-5 py-3">
              <h2 className="font-heading text-sm font-semibold">
                {config.label}
              </h2>
              <span className="text-muted-foreground text-xs">
                {items.length}
              </span>
            </div>
            <div className="divide-y">
              {items.map((task) => (
                <TaskDetailDialog key={task.id} task={task} variant="row" />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

export default async function TarefasPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; tag?: string; page?: string }>
}) {
  const { view, tag, page: pageParam } = await searchParams
  const kanban = view === "kanban"
  const page = parsePage(pageParam)

  const memberships = await getMemberships()
  const active = await getActiveTenant(memberships)
  if (!active) return null

  const tagIds = tag
    ? await entityIdsByTag(active.tenantId, "task", tag)
    : undefined

  const [projects, members, milestones, tags, customFields] = await Promise.all(
    [
      listProjects(active.tenantId),
      listTenantMembers(active.tenantId),
      listMilestoneOptions(active.tenantId),
      listTags(active.tenantId),
      listCustomFieldDefinitions(active.tenantId, "task"),
    ],
  )

  let tasks: TaskListRow[]
  let total: number
  if (kanban) {
    const all = await listTasks(active.tenantId)
    tasks = tagIds ? all.filter((task) => tagIds.includes(task.id)) : all
    total = tasks.length
  } else {
    const result = await listTasksPage(active.tenantId, {
      page,
      pageSize: PAGE_SIZE,
      ids: tagIds,
    })
    tasks = result.rows
    total = result.total
  }

  const projectOptions = projects.map((project) => ({
    id: project.id,
    name: project.name,
  }))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Tarefas</h1>
          <p className="text-muted-foreground text-sm">
            {total} tarefa(s) · responsáveis, prazos e prioridades.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-muted inline-flex items-center gap-1 rounded-full p-1">
            <Link
              href="/app/tarefas"
              className={cn(
                "rounded-full px-3 py-1 text-sm",
                !kanban && "bg-card font-medium shadow-sm",
              )}
            >
              Lista
            </Link>
            <Link
              href="/app/tarefas?view=kanban"
              className={cn(
                "rounded-full px-3 py-1 text-sm",
                kanban && "bg-card font-medium shadow-sm",
              )}
            >
              Kanban
            </Link>
          </div>
          <TaskFormDialog
            projects={projectOptions}
            members={members}
            milestones={milestones}
            customFields={customFields}
            label="Nova tarefa"
          />
        </div>
      </div>

      <TagFilter
        tags={tags}
        active={tag}
        hrefFor={(tagId) => {
          const params = new URLSearchParams()
          if (kanban) params.set("view", "kanban")
          if (tagId) params.set("tag", tagId)
          const query = params.toString()
          return query ? `/app/tarefas?${query}` : "/app/tarefas"
        }}
      />

      {tasks.length === 0 ? (
        <div className="text-muted-foreground rounded-2xl border border-dashed p-12 text-center text-sm">
          Nenhuma tarefa cadastrada ainda.
        </div>
      ) : kanban ? (
        <KanbanBoard tasks={tasks} />
      ) : (
        <TaskList tasks={tasks} />
      )}

      {kanban ? null : (
        <Pagination
          page={page}
          total={total}
          hrefFor={(target) => {
            const params = new URLSearchParams()
            if (tag) params.set("tag", tag)
            if (target > 1) params.set("page", String(target))
            const query = params.toString()
            return query ? `/app/tarefas?${query}` : "/app/tarefas"
          }}
        />
      )}
    </div>
  )
}

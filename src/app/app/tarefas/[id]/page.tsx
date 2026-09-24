import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Check, Circle, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TaskPriorityBadge, TaskStatusBadge } from "@/components/app/task-bits"
import { CommentsSection } from "@/components/app/comments-section"
import { AttachmentsSection } from "@/components/app/attachments-section"
import { TimeEntriesTable } from "@/components/app/time-entries-table"
import { getMemberships } from "@/lib/auth"
import { getActiveTenant } from "@/lib/tenant"
import {
  getProject,
  listProjects,
  listTenantMembers,
} from "@/server/queries/projects"
import { getTask, listChecklist } from "@/server/queries/tasks"
import {
  addChecklistItemAction,
  deleteChecklistItemAction,
  toggleChecklistItemAction,
} from "@/server/actions/tasks"
import { TaskFormDialog } from "../task-form-dialog"
import { DeleteTaskButton } from "../delete-task-button"

function DetailRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="space-y-1">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="text-sm">{value || "—"}</dd>
    </div>
  )
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString("pt-BR") : null
}

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const memberships = await getMemberships()
  const active = await getActiveTenant(memberships)
  if (!active) return null

  const task = await getTask(active.tenantId, id)
  if (!task) notFound()

  const [project, projects, members, checklist] = await Promise.all([
    getProject(active.tenantId, task.project_id),
    listProjects(active.tenantId),
    listTenantMembers(active.tenantId),
    listChecklist(active.tenantId, task.id),
  ])

  const projectOptions = projects.map((item) => ({
    id: item.id,
    name: item.name,
  }))
  const assigneeName =
    members.find((member) => member.user_id === task.assignee_id)?.full_name ??
    null
  const done = checklist.filter((item) => item.is_done).length

  return (
    <div className="space-y-6">
      <Link
        href="/app/tarefas"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" />
        Tarefas
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-xl font-semibold tracking-tight">{task.name}</h1>
          <div className="flex items-center gap-3">
            <TaskStatusBadge status={task.status} />
            <TaskPriorityBadge priority={task.priority} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TaskFormDialog
            projects={projectOptions}
            members={members}
            task={task}
            label="Editar"
          />
          <DeleteTaskButton id={task.id} projectId={task.project_id} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Detalhes</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <dt className="text-muted-foreground text-xs">Projeto</dt>
                <dd className="text-sm">
                  {project ? (
                    <Link
                      href={`/app/projetos/${project.id}`}
                      className="hover:underline"
                    >
                      {project.name}
                    </Link>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <DetailRow label="Responsável" value={assigneeName} />
              <DetailRow label="Início" value={formatDate(task.start_date)} />
              <DetailRow label="Prazo" value={formatDate(task.due_date)} />
              <DetailRow
                label="Concluída em"
                value={formatDate(task.date_finished)}
              />
              <DetailRow
                label="Faturável"
                value={task.billable ? "Sim" : "Não"}
              />
              <DetailRow
                label="Valor/hora"
                value={
                  task.hourly_rate !== null
                    ? Number(task.hourly_rate).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })
                    : null
                }
              />
            </dl>
            {task.description ? (
              <p className="text-muted-foreground mt-4 text-sm whitespace-pre-wrap">
                {task.description}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">
              Checklist
              {checklist.length > 0 ? (
                <span className="text-muted-foreground ml-2 text-xs font-normal">
                  {done}/{checklist.length}
                </span>
              ) : null}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {checklist.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Nenhum item no checklist.
              </p>
            ) : (
              <ul className="space-y-1">
                {checklist.map((item) => (
                  <li
                    key={item.id}
                    className="hover:bg-muted/50 flex items-center gap-2 rounded-md px-1 py-1"
                  >
                    <form action={toggleChecklistItemAction}>
                      <input type="hidden" name="id" value={item.id} />
                      <input type="hidden" name="task_id" value={task.id} />
                      <input
                        type="hidden"
                        name="done"
                        value={item.is_done ? "0" : "1"}
                      />
                      <button
                        type="submit"
                        aria-label={
                          item.is_done ? "Desmarcar item" : "Marcar item"
                        }
                        className="text-muted-foreground hover:text-foreground flex size-5 items-center justify-center"
                      >
                        {item.is_done ? (
                          <Check className="text-primary size-4" />
                        ) : (
                          <Circle className="size-4" />
                        )}
                      </button>
                    </form>
                    <span
                      className={
                        item.is_done
                          ? "text-muted-foreground flex-1 text-sm line-through"
                          : "flex-1 text-sm"
                      }
                    >
                      {item.title}
                    </span>
                    <form action={deleteChecklistItemAction}>
                      <input type="hidden" name="id" value={item.id} />
                      <input type="hidden" name="task_id" value={task.id} />
                      <button
                        type="submit"
                        aria-label="Remover item"
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}

            <form action={addChecklistItemAction} className="flex gap-2">
              <input type="hidden" name="task_id" value={task.id} />
              <Input name="title" placeholder="Novo item..." required />
              <Button type="submit" variant="outline" size="sm">
                Adicionar
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <CommentsSection
        tenantId={active.tenantId}
        entityType="task"
        entityId={task.id}
      />
      <AttachmentsSection
        tenantId={active.tenantId}
        entityType="task"
        entityId={task.id}
      />
      <TimeEntriesTable
        tenantId={active.tenantId}
        taskId={task.id}
        title="Tempo registrado"
      />
    </div>
  )
}

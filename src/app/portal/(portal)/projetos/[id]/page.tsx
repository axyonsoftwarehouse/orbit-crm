import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, FileText } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProgressBar, ProjectStatusBadge } from "@/components/app/project-bits"
import { TaskStatusBadge } from "@/components/app/task-bits"
import { formatDate } from "@/lib/format"
import { getPortalContact, getPortalProject } from "@/server/queries/portal"
import { listTasks } from "@/server/queries/tasks"
import { listAttachments } from "@/server/queries/attachments"

export default async function PortalProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const contact = await getPortalContact()
  if (!contact) return null

  const project = await getPortalProject(contact.company_id, id)
  if (!project) notFound()

  const [tasks, attachments] = await Promise.all([
    listTasks(contact.tenant_id, { projectId: project.id }),
    listAttachments(contact.tenant_id, "project", project.id),
  ])

  return (
    <div className="space-y-6">
      <Link
        href="/portal/projetos"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" />
        Projetos
      </Link>

      <div className="space-y-2">
        <h1 className="font-heading text-xl font-semibold tracking-tight">
          {project.name}
        </h1>
        <div className="flex items-center gap-3">
          <ProjectStatusBadge status={project.status} />
          <ProgressBar value={project.progress} />
          <span className="text-muted-foreground text-xs">
            Prazo: {formatDate(project.deadline)}
          </span>
        </div>
      </div>

      {project.description ? (
        <p className="text-muted-foreground text-sm whitespace-pre-wrap">
          {project.description}
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tarefas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {tasks.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Nenhuma tarefa neste projeto.
            </p>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className="flex flex-wrap items-center justify-between gap-3 border-b pb-2 last:border-0 last:pb-0"
              >
                <span className="text-sm">{task.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground text-xs">
                    {formatDate(task.due_date)}
                  </span>
                  <TaskStatusBadge status={task.status} />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {attachments.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Arquivos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {attachments.map((file) => (
              <a
                key={file.id}
                href={file.url ?? "#"}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-sm hover:underline"
              >
                <FileText className="text-muted-foreground size-4" />
                {file.file_name}
              </a>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}

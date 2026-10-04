import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ProgressBar, ProjectStatusBadge } from "@/components/app/project-bits"
import { MilestoneStatusBadge } from "@/components/app/milestone-bits"
import { ProjectGantt } from "@/components/app/project-gantt"
import { TaskStatusBadge } from "@/components/app/task-bits"
import { TagPicker } from "@/components/app/tag-picker"
import { CustomFieldsCard } from "@/components/app/custom-fields-view"
import { CommentsSection } from "@/components/app/comments-section"
import { AttachmentsSection } from "@/components/app/attachments-section"
import { TimeEntriesTable } from "@/components/app/time-entries-table"
import { formatMoney } from "@/lib/format"
import {
  formatDuration,
  listUnbilledBillableEntries,
  summarizeBillable,
} from "@/server/queries/time"
import { InvoiceTimeButton } from "./invoice-time-button"
import { PROJECT_BILLING_TYPES, type ProjectBillingType } from "@/lib/constants"
import { getMemberships } from "@/lib/auth"
import { getActiveTenant } from "@/lib/tenant"
import { getCompany, listCompanies } from "@/server/queries/companies"
import {
  getProject,
  listProjectMembers,
  listProjects,
  listTenantMembers,
} from "@/server/queries/projects"
import {
  listMilestoneOptions,
  listMilestones,
} from "@/server/queries/milestones"
import { listTaskDependencies, listTasks } from "@/server/queries/tasks"
import { listTags, tagsForEntity } from "@/server/queries/tags"
import {
  customFieldValuesForEntity,
  listCustomFieldDefinitions,
} from "@/server/queries/custom-fields"
import { addProjectMemberAction } from "@/server/actions/projects"
import { TaskFormDialog } from "../../tarefas/task-form-dialog"
import { ProjectFormDialog } from "../project-form-dialog"
import { DeleteProjectButton } from "../delete-project-button"
import { RemoveMemberButton } from "./remove-member-button"
import { MilestoneFormDialog } from "./milestone-form-dialog"
import { DeleteMilestoneButton } from "./delete-milestone-button"

const fieldClass =
  "border-input bg-background dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3"

function DetailRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="space-y-1">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="text-sm">{value || "—"}</dd>
    </div>
  )
}

function money(value: number | null) {
  if (value === null || value === undefined) return null
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value))
}

function date(value: string | null) {
  return value ? new Date(value).toLocaleDateString("pt-BR") : null
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const memberships = await getMemberships()
  const active = await getActiveTenant(memberships)
  if (!active) return null

  const project = await getProject(active.tenantId, id)
  if (!project) notFound()

  const [
    company,
    companies,
    allProjects,
    members,
    tenantMembers,
    tasks,
    billableEntries,
    milestones,
    milestoneOptions,
    entityTags,
    allTags,
    projectCustomFields,
    projectCustomValues,
    taskCustomFields,
  ] = await Promise.all([
    project.company_id
      ? getCompany(active.tenantId, project.company_id)
      : Promise.resolve(null),
    listCompanies(active.tenantId),
    listProjects(active.tenantId),
    listProjectMembers(active.tenantId, project.id),
    listTenantMembers(active.tenantId),
    listTasks(active.tenantId, { projectId: project.id }),
    listUnbilledBillableEntries(active.tenantId, project.id),
    listMilestones(active.tenantId, project.id),
    listMilestoneOptions(active.tenantId),
    tagsForEntity(active.tenantId, "project", project.id),
    listTags(active.tenantId),
    listCustomFieldDefinitions(active.tenantId, "project"),
    customFieldValuesForEntity(active.tenantId, "project", project.id),
    listCustomFieldDefinitions(active.tenantId, "task"),
  ])

  const taskDependencies = await listTaskDependencies(
    active.tenantId,
    tasks.map((task) => task.id),
  )

  const billable = summarizeBillable(billableEntries)

  const projectOptions = allProjects.map((item) => ({
    id: item.id,
    name: item.name,
  }))
  const doneTasks = tasks.filter((task) => task.status === 5).length
  const progress = project.progress_from_tasks
    ? tasks.length > 0
      ? Math.round((doneTasks / tasks.length) * 100)
      : 0
    : project.progress

  const memberIds = new Set(members.map((member) => member.user_id))
  const available = tenantMembers.filter((tm) => !memberIds.has(tm.user_id))

  return (
    <div className="space-y-6">
      <Link
        href="/app/projetos"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" />
        Projetos
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-xl font-semibold tracking-tight">
            {project.name}
          </h1>
          <div className="flex items-center gap-3">
            <ProjectStatusBadge status={project.status} />
            <ProgressBar value={progress} />
          </div>
          <TagPicker
            entityType="project"
            entityId={project.id}
            assigned={entityTags}
            all={allTags}
          />
        </div>
        <div className="flex items-center gap-2">
          <ProjectFormDialog
            project={project}
            companies={companies}
            customFields={projectCustomFields}
            customValues={projectCustomValues}
            label="Editar"
          />
          <DeleteProjectButton id={project.id} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Visão geral</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-3">
            <DetailRow label="Cliente" value={company?.name ?? null} />
            <DetailRow
              label="Tipo de cobrança"
              value={
                PROJECT_BILLING_TYPES[
                  project.billing_type as ProjectBillingType
                ]?.label ?? null
              }
            />
            <DetailRow label="Valor fixo" value={money(project.project_cost)} />
            <DetailRow
              label="Valor/hora"
              value={money(project.rate_per_hour)}
            />
            <DetailRow
              label="Horas estimadas"
              value={project.estimated_hours?.toString() ?? null}
            />
            <DetailRow label="Início" value={date(project.start_date)} />
            <DetailRow label="Prazo" value={date(project.deadline)} />
            <DetailRow
              label="Concluído em"
              value={date(project.date_finished)}
            />
          </dl>
          {project.description ? (
            <p className="text-muted-foreground mt-4 text-sm whitespace-pre-wrap">
              {project.description}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">
            Marcos
            {milestones.length > 0 ? (
              <span className="text-muted-foreground ml-2 text-xs font-normal">
                {milestones.filter((item) => item.status === 3).length}/
                {milestones.length}
              </span>
            ) : null}
          </CardTitle>
          <MilestoneFormDialog projectId={project.id} label="Novo marco" />
        </CardHeader>
        <CardContent className="px-0">
          {milestones.length === 0 ? (
            <p className="text-muted-foreground px-6 py-4 text-sm">
              Nenhum marco definido neste projeto.
            </p>
          ) : (
            <ul className="divide-y">
              {milestones.map((milestone) => (
                <li
                  key={milestone.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-6 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: milestone.color }}
                    />
                    <div>
                      <p className="text-sm font-medium">{milestone.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {milestone.due_date
                          ? `Prazo ${date(milestone.due_date)}`
                          : "Sem prazo"}
                        {milestone.task_count > 0
                          ? ` · ${milestone.done_count}/${milestone.task_count} tarefas`
                          : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MilestoneStatusBadge status={milestone.status} />
                    <ProgressBar value={milestone.progress} />
                    <MilestoneFormDialog
                      projectId={project.id}
                      milestone={milestone}
                      label="Editar"
                    />
                    <DeleteMilestoneButton
                      id={milestone.id}
                      projectId={project.id}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">
            Tarefas
            {tasks.length > 0 ? (
              <span className="text-muted-foreground ml-2 text-xs font-normal">
                {doneTasks}/{tasks.length}
              </span>
            ) : null}
          </CardTitle>
          <TaskFormDialog
            projects={projectOptions}
            members={tenantMembers}
            milestones={milestoneOptions}
            customFields={taskCustomFields}
            defaultProjectId={project.id}
            label="Nova tarefa"
          />
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tarefa</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prazo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-muted-foreground h-20 text-center text-sm"
                  >
                    Nenhuma tarefa neste projeto.
                  </TableCell>
                </TableRow>
              ) : (
                tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/app/tarefas/${task.id}`}
                        className="hover:underline"
                      >
                        {task.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {task.assignee_name ?? "—"}
                    </TableCell>
                    <TableCell>
                      <TaskStatusBadge status={task.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {task.due_date
                        ? new Date(task.due_date).toLocaleDateString("pt-BR")
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cronograma</CardTitle>
        </CardHeader>
        <CardContent>
          <ProjectGantt
            projectId={project.id}
            tasks={tasks}
            milestones={milestones}
            dependencies={taskDependencies}
            projectStart={project.start_date}
            projectDeadline={project.deadline}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Equipe</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {members.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Nenhum membro atribuído.
            </p>
          ) : (
            <ul className="divide-y">
              {members.map((member) => (
                <li
                  key={member.user_id}
                  className="flex items-center justify-between py-2"
                >
                  <span className="text-sm">
                    {member.full_name ?? "Usuário"}
                  </span>
                  <RemoveMemberButton
                    projectId={project.id}
                    userId={member.user_id}
                  />
                </li>
              ))}
            </ul>
          )}

          {available.length > 0 ? (
            <form
              action={addProjectMemberAction}
              className="flex items-end gap-2"
            >
              <input type="hidden" name="project_id" value={project.id} />
              <select
                name="user_id"
                required
                defaultValue=""
                className={fieldClass}
              >
                <option value="" disabled>
                  Selecione um membro…
                </option>
                {available.map((member) => (
                  <option key={member.user_id} value={member.user_id}>
                    {member.full_name ?? member.user_id}
                  </option>
                ))}
              </select>
              <Button type="submit" variant="outline" size="sm">
                Adicionar
              </Button>
            </form>
          ) : (
            <p className="text-muted-foreground text-xs">
              Todos os membros da empresa já estão no projeto.
            </p>
          )}
        </CardContent>
      </Card>

      {billable.count > 0 ? (
        <div className="bg-card flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3">
          <p className="text-sm">
            <span className="font-medium">{billable.count}</span> apontamento(s)
            faturável(is) não faturado(s) · {formatDuration(billable.seconds)} ·{" "}
            {formatMoney(billable.amount)}
          </p>
          <InvoiceTimeButton projectId={project.id} />
        </div>
      ) : null}

      <TimeEntriesTable
        tenantId={active.tenantId}
        projectId={project.id}
        title="Timesheet"
      />

      <CustomFieldsCard
        fields={projectCustomFields}
        values={projectCustomValues}
      />

      <CommentsSection
        tenantId={active.tenantId}
        entityType="project"
        entityId={project.id}
      />
      <AttachmentsSection
        tenantId={active.tenantId}
        entityType="project"
        entityId={project.id}
      />
    </div>
  )
}

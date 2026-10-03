import Link from "next/link"
import { CheckSquare, Clock } from "lucide-react"
import { AvatarStack } from "@/components/app/avatar-stack"
import { TagFilter } from "@/components/app/tag-filter"
import { Pagination } from "@/components/app/pagination"
import { getMemberships } from "@/lib/auth"
import { getActiveTenant } from "@/lib/tenant"
import { PAGE_SIZE, parsePage } from "@/lib/pagination"
import { listCompanies } from "@/server/queries/companies"
import {
  listProjectsPage,
  projectMembersByProject,
} from "@/server/queries/projects"
import { taskCountsByProject } from "@/server/queries/tasks"
import { entityIdsByTag, listTags } from "@/server/queries/tags"
import { listCustomFieldDefinitions } from "@/server/queries/custom-fields"
import { ProjectFormDialog } from "./project-form-dialog"
import type { ProjectListRow } from "@/server/queries/projects"

const GROUPS: { key: string; label: string; statuses: number[] }[] = [
  { key: "pending", label: "Pendentes", statuses: [1] },
  { key: "run", label: "Em andamento", statuses: [2, 3] },
  { key: "done", label: "Concluídos", statuses: [4] },
  { key: "cancelled", label: "Cancelados", statuses: [5] },
]

function DeadlinePill({ date }: { date: string | null }) {
  if (!date) return null

  const due = new Date(`${date}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days = Math.round((due.getTime() - today.getTime()) / 86_400_000)

  const overdue = days < 0
  const urgent = days <= 3
  const label = overdue
    ? `${Math.abs(days)} dias atrasado`
    : `${days} dias restantes`

  return (
    <span
      className={
        overdue || urgent
          ? "inline-flex items-center gap-1 rounded-full bg-[#fc5a5a]/12 px-2 py-0.5 text-xs font-medium text-[#e02e2e] dark:text-[#ff6b6b]"
          : "inline-flex items-center gap-1 rounded-full bg-[#ff974a]/15 px-2 py-0.5 text-xs font-medium text-[#b25e00] dark:text-[#ff974a]"
      }
    >
      <Clock className="size-3.5" />
      {label}
    </span>
  )
}

function ProjectRow({
  project,
  members,
  counts,
}: {
  project: ProjectListRow
  members: { user_id: string; full_name: string | null }[]
  counts: { done: number; total: number } | undefined
}) {
  const total = counts?.total ?? 0
  const done = counts?.done ?? 0

  return (
    <div className="hover:bg-muted/40 flex flex-wrap items-center gap-x-5 gap-y-3 px-5 py-4">
      <div className="min-w-[220px] flex-1">
        <Link
          href={`/app/projetos/${project.id}`}
          className="font-heading text-sm font-semibold hover:underline"
        >
          {project.name}
        </Link>
        <div className="text-muted-foreground text-xs">
          {project.company?.name ?? "Interno"}
        </div>
      </div>

      <div className="text-muted-foreground flex items-center gap-4 text-xs">
        {total > 0 ? (
          <span className="flex items-center gap-1">
            <CheckSquare className="size-4" />
            {done}/{total}
          </span>
        ) : null}
        <DeadlinePill date={project.deadline} />
      </div>

      <div className="flex w-44 items-center gap-2">
        <div className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
          <div
            className="h-full rounded-full bg-[#3dd598]"
            style={{ width: `${project.progress}%` }}
          />
        </div>
        <span className="text-muted-foreground w-9 text-right text-xs">
          {project.progress}%
        </span>
      </div>

      <AvatarStack people={members} />
    </div>
  )
}

export default async function ProjetosPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; page?: string }>
}) {
  const { tag, page: pageParam } = await searchParams
  const page = parsePage(pageParam)
  const memberships = await getMemberships()
  const active = await getActiveTenant(memberships)
  if (!active) return null

  const tagIds = tag
    ? await entityIdsByTag(active.tenantId, "project", tag)
    : undefined

  const [
    { rows: projects, total },
    membersByProject,
    taskCounts,
    companies,
    tags,
    customFields,
  ] = await Promise.all([
    listProjectsPage(active.tenantId, {
      page,
      pageSize: PAGE_SIZE,
      ids: tagIds,
    }),
    projectMembersByProject(active.tenantId),
    taskCountsByProject(active.tenantId),
    listCompanies(active.tenantId),
    listTags(active.tenantId),
    listCustomFieldDefinitions(active.tenantId, "project"),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Projetos</h1>
          <p className="text-muted-foreground text-sm">
            {total} projeto(s) · prazos, progresso e equipe.
          </p>
        </div>
        <ProjectFormDialog
          companies={companies}
          customFields={customFields}
          label="Novo projeto"
        />
      </div>

      <TagFilter
        tags={tags}
        active={tag}
        hrefFor={(tagId) =>
          tagId ? `/app/projetos?tag=${tagId}` : "/app/projetos"
        }
      />

      {projects.length === 0 ? (
        <div className="text-muted-foreground rounded-2xl border border-dashed p-12 text-center text-sm">
          Nenhum projeto cadastrado ainda.
        </div>
      ) : (
        GROUPS.map((group) => {
          const items = projects.filter((project) =>
            group.statuses.includes(project.status),
          )
          if (items.length === 0) return null

          return (
            <section
              key={group.key}
              className="bg-card overflow-hidden rounded-2xl border shadow-[0_6px_24px_-14px_rgba(23,23,37,0.18)] dark:shadow-none"
            >
              <div className="flex items-center justify-between border-b px-5 py-3">
                <h2 className="font-heading text-sm font-semibold">
                  {group.label}
                </h2>
                <span className="text-muted-foreground text-xs">
                  {items.length}
                </span>
              </div>
              <div className="divide-y">
                {items.map((project) => (
                  <ProjectRow
                    key={project.id}
                    project={project}
                    members={membersByProject[project.id] ?? []}
                    counts={taskCounts[project.id]}
                  />
                ))}
              </div>
            </section>
          )
        })
      )}

      <Pagination
        page={page}
        total={total}
        hrefFor={(target) => {
          const params = new URLSearchParams()
          if (tag) params.set("tag", tag)
          if (target > 1) params.set("page", String(target))
          const query = params.toString()
          return query ? `/app/projetos?${query}` : "/app/projetos"
        }}
      />
    </div>
  )
}

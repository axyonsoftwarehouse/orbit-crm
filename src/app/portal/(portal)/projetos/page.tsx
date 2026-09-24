import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { ProgressBar, ProjectStatusBadge } from "@/components/app/project-bits"
import { formatDate } from "@/lib/format"
import { getPortalContact, listPortalProjects } from "@/server/queries/portal"

export default async function PortalProjectsPage() {
  const contact = await getPortalContact()
  if (!contact) return null

  const projects = await listPortalProjects(contact.company_id)

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-xl font-semibold tracking-tight">
        Projetos
      </h1>

      {projects.length === 0 ? (
        <div className="text-muted-foreground rounded-2xl border border-dashed p-12 text-center text-sm">
          Nenhum projeto ainda.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((project) => (
            <Card key={project.id}>
              <CardContent className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <Link
                    href={`/portal/projetos/${project.id}`}
                    className="font-heading text-sm font-semibold hover:underline"
                  >
                    {project.name}
                  </Link>
                  <ProjectStatusBadge status={project.status} />
                </div>
                <ProgressBar value={project.progress} />
                <div className="text-muted-foreground text-xs">
                  Prazo: {formatDate(project.deadline)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

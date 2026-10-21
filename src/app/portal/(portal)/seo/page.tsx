import Link from "next/link"
import { Search } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { SeoScoreBadge } from "@/components/app/seo-bits"
import { formatDate } from "@/lib/format"
import { getPortalContact, listPortalSeoSites } from "@/server/queries/portal"

export default async function PortalSeoPage() {
  const contact = await getPortalContact()
  if (!contact) return null

  const sites = await listPortalSeoSites(contact.company_id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-xl font-semibold tracking-tight">
          SEO
        </h1>
        <p className="text-muted-foreground text-sm">
          Acompanhe o score e os problemas encontrados nos seus sites.
        </p>
      </div>

      {sites.length === 0 ? (
        <div className="text-muted-foreground rounded-2xl border border-dashed p-12 text-center text-sm">
          Nenhum site monitorado ainda.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {sites.map((site) => (
            <Card key={site.id}>
              <CardContent className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/portal/seo/${site.id}`}
                      className="font-heading block truncate text-sm font-semibold hover:underline"
                    >
                      {site.label}
                    </Link>
                    <p className="text-muted-foreground truncate text-xs">
                      {site.url}
                    </p>
                  </div>
                  <SeoScoreBadge score={site.score} />
                </div>

                <div className="text-muted-foreground flex items-center justify-between text-xs">
                  <span>
                    {site.last_audit_at
                      ? `Última auditoria em ${formatDate(site.last_audit_at)}`
                      : "Sem auditoria concluída"}
                  </span>
                  {site.last_audit_at ? (
                    <span>{site.issues_total} problema(s)</span>
                  ) : null}
                </div>

                {!site.last_audit_at ? (
                  <div className="text-muted-foreground flex items-center gap-2 text-xs">
                    <Search className="size-3.5" />A empresa ainda não publicou
                    uma auditoria.
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

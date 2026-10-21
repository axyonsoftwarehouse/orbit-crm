import Link from "next/link"
import { MessageSquare } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { SocialStatusBadge } from "@/components/app/social-bits"
import { formatDate } from "@/lib/format"
import { getPortalContact } from "@/server/queries/portal"
import { listPortalSocialPosts } from "@/server/queries/social"

export default async function PortalSocialPage() {
  const contact = await getPortalContact()
  if (!contact) return null

  const posts = await listPortalSocialPosts(contact.company_id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-xl font-semibold tracking-tight">
          Social
        </h1>
        <p className="text-muted-foreground text-sm">
          Acompanhe e aprove os posts das suas redes sociais.
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="text-muted-foreground rounded-2xl border border-dashed p-12 text-center text-sm">
          Nenhum post disponível ainda.
        </div>
      ) : (
        <div className="grid gap-4">
          {posts.map((post) => (
            <Card key={post.id}>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <Link
                    href={`/portal/social/${post.id}`}
                    className="line-clamp-2 max-w-2xl text-sm font-medium hover:underline"
                  >
                    {post.content}
                  </Link>
                  <SocialStatusBadge status={post.status} />
                </div>
                <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-xs">
                  <span className="inline-flex items-center gap-1">
                    <MessageSquare className="size-3.5" />
                    {post.target_count} rede(s)
                  </span>
                  <span>
                    {post.scheduled_at
                      ? `Agendado para ${formatDate(post.scheduled_at)}`
                      : "Sem data agendada"}
                  </span>
                  {post.rejection_note ? (
                    <span className="text-destructive">
                      {post.rejection_note}
                    </span>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

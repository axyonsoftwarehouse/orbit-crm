import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, CalendarClock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  SocialProviderBadge,
  SocialStatusBadge,
} from "@/components/app/social-bits"
import { getPortalContact } from "@/server/queries/portal"
import { getPortalSocialPost } from "@/server/queries/social"
import { respondPortalSocialPostAction } from "@/server/actions/social"

function formatDateTime(value: string | null) {
  if (!value) return "—"
  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  })
}

export default async function PortalSocialDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const contact = await getPortalContact()
  if (!contact) return null

  const post = await getPortalSocialPost(contact.company_id, id)
  if (!post) notFound()

  return (
    <div className="space-y-6">
      <Link
        href="/portal/social"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" />
        Social
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="font-heading text-xl font-semibold tracking-tight">
            Post
          </h1>
          <p className="text-muted-foreground text-sm">
            Criado em {formatDateTime(post.created_at)}
          </p>
        </div>
        <SocialStatusBadge status={post.status} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conteúdo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap">{post.content}</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Redes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {post.targets.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Nenhuma rede vinculada.
              </p>
            ) : (
              post.targets.map((target, index) => (
                <div
                  key={`${target.provider}-${index}`}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2">
                    <SocialProviderBadge provider={target.provider} />
                    <span className="text-sm">{target.display_name}</span>
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {target.status}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Agenda</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <CalendarClock className="text-muted-foreground size-4" />
              <span>Agendado: {formatDateTime(post.scheduled_at)}</span>
            </div>
            <p className="text-muted-foreground">
              Publicado: {formatDateTime(post.published_at)}
            </p>
          </CardContent>
        </Card>
      </div>

      {post.status === "pending_approval" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aprovação</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={respondPortalSocialPostAction} className="space-y-3">
              <input type="hidden" name="post_id" value={post.id} />
              <Input
                name="note"
                placeholder="Comentário (opcional, obrigatório ao rejeitar)"
              />
              <div className="flex flex-wrap gap-2">
                <Button type="submit" name="approve" value="1">
                  Aprovar
                </Button>
                <Button
                  type="submit"
                  name="approve"
                  value="0"
                  variant="destructive"
                >
                  Rejeitar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {post.rejection_note ? (
        <p className="text-destructive text-sm">
          Motivo da rejeição: {post.rejection_note}
        </p>
      ) : null}
    </div>
  )
}

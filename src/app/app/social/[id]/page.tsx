import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, CalendarClock, MessageSquare } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  SocialProviderBadge,
  SocialStatusBadge,
} from "@/components/app/social-bits"
import { formatDate } from "@/lib/format"
import { SOCIAL_EVENT_LABELS } from "@/lib/constants"
import { getMemberships } from "@/lib/auth"
import { getActiveTenant } from "@/lib/tenant"
import { isManager } from "@/server/permissions"
import { getSocialPost, listSocialMedia } from "@/server/queries/social"
import { SocialPostActions } from "./social-post-actions"
import { ManualPublishPanel } from "./manual-publish-panel"
import { SocialMediaSection } from "./social-media-section"
import { SocialPreview } from "@/components/app/social-preview"

function formatDateTime(value: string | null) {
  if (!value) return "—"
  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  })
}

export default async function SocialPostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const memberships = await getMemberships()
  const active = await getActiveTenant(memberships)
  if (!active) return null

  const post = await getSocialPost(active.tenantId, id)
  if (!post) notFound()

  const media = await listSocialMedia(active.tenantId, post.id)

  return (
    <div className="space-y-6">
      <Link
        href="/app/social"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" />
        Social
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <MessageSquare className="text-muted-foreground size-5" />
            <h1 className="text-xl font-semibold tracking-tight">Post</h1>
            <SocialStatusBadge status={post.status} />
          </div>
          <p className="text-muted-foreground text-sm">
            {post.company?.name ?? "Sem cliente"} · criado em{" "}
            {formatDateTime(post.created_at)}
          </p>
        </div>
      </div>

      <SocialPostActions
        id={post.id}
        status={post.status}
        canManage={isManager(active.role)}
      />

      <Card>
        <CardHeader>
          <CardTitle>Conteúdo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap">{post.content}</p>
        </CardContent>
      </Card>

      {["approved", "scheduled"].includes(post.status) ? (
        <ManualPublishPanel postId={post.id} content={post.content} />
      ) : null}

      <SocialMediaSection tenantId={active.tenantId} postId={post.id} />

      {post.targets.length > 0 ? (
        <div>
          <h2 className="mb-3 text-sm font-semibold">Prévia por rede</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {post.targets.map((target) => (
              <SocialPreview
                key={target.id}
                provider={target.provider}
                content={post.content}
                media={media.map((item) => ({
                  url: item.url,
                  alt: item.alt_text,
                }))}
              />
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Destinos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {post.targets.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Nenhuma conta vinculada.
              </p>
            ) : (
              post.targets.map((target) => (
                <div
                  key={target.id}
                  className="flex items-center justify-between gap-2 border-b pb-2 last:border-0 last:pb-0"
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
            {post.rejection_note ? (
              <p className="text-destructive">
                Motivo da rejeição: {post.rejection_note}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {post.events.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Nenhum evento registrado.
            </p>
          ) : (
            post.events.map((event) => (
              <div
                key={event.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b pb-2 text-sm last:border-0 last:pb-0"
              >
                <span>{SOCIAL_EVENT_LABELS[event.event] ?? event.event}</span>
                <span className="text-muted-foreground text-xs">
                  {formatDateTime(event.created_at)}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <p className="text-muted-foreground text-xs">
        Criado em {formatDate(post.created_at)}. A publicação automática via
        agregador entra na próxima etapa.
      </p>
    </div>
  )
}

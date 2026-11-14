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
import { socialNativeEnabled } from "@/lib/env"
import { getMemberships } from "@/lib/auth"
import { getActiveTenant } from "@/lib/tenant"
import { isManager } from "@/server/permissions"
import {
  getSocialPost,
  getSocialSettings,
  listSocialMedia,
} from "@/server/queries/social"
import { SocialPostActions } from "./social-post-actions"
import { ManualPublishPanel } from "./manual-publish-panel"
import { SocialMediaSection } from "./social-media-section"
import { SocialPreview } from "@/components/app/social-preview"

const TARGET_STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  publishing: "Publicando",
  published: "Publicado",
  failed: "Falhou",
}

function formatDateTime(value: string | null, timeZone: string) {
  if (!value) return "—"
  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone,
  })
}

export default async function SocialPostDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const { error } = await searchParams
  const memberships = await getMemberships()
  const active = await getActiveTenant(memberships)
  if (!active) return null

  const [post, settings] = await Promise.all([
    getSocialPost(active.tenantId, id),
    getSocialSettings(active.tenantId),
  ])
  if (!post) notFound()

  const media = await listSocialMedia(active.tenantId, post.id)
  const nativeEnabled = socialNativeEnabled()
  const hasNativeTarget = post.targets.some(
    (target) =>
      target.provider === "instagram" || target.provider === "linkedin",
  )
  const hasInstagramTarget = post.targets.some(
    (target) => target.provider === "instagram",
  )
  const showManualPublish =
    ["approved", "scheduled"].includes(post.status) &&
    !(nativeEnabled && hasNativeTarget)

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
            {formatDateTime(post.created_at, settings.default_timezone)}
          </p>
        </div>
      </div>

      {error === "media" ? (
        <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-xl border px-4 py-3 text-sm">
          O Instagram exige pelo menos uma imagem. Anexe a imagem antes de
          agendar.
        </div>
      ) : null}
      {error === "schedule" ? (
        <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-xl border px-4 py-3 text-sm">
          Data e hora inválidas. Confira o horário e tente novamente.
        </div>
      ) : null}
      {nativeEnabled && hasInstagramTarget && media.length === 0 ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          Este post tem destino no Instagram e ainda não possui imagem. O
          agendamento será bloqueado até você anexar uma imagem.
        </div>
      ) : null}

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

      {showManualPublish ? (
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
                  <div className="text-right">
                    <div className="text-muted-foreground text-xs">
                      {TARGET_STATUS_LABELS[target.status] ?? target.status}
                    </div>
                    {target.error ? (
                      <div className="text-destructive max-w-56 text-xs">
                        {target.error}
                      </div>
                    ) : null}
                  </div>
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
              <span>
                Agendado:{" "}
                {formatDateTime(post.scheduled_at, settings.default_timezone)}
              </span>
            </div>
            <p className="text-muted-foreground">
              Publicado:{" "}
              {formatDateTime(post.published_at, settings.default_timezone)}
            </p>
            {post.rejection_note ? (
              <p className="text-destructive">
                Motivo da rejeição: {post.rejection_note}
              </p>
            ) : null}
            {post.failure_reason ? (
              <p className="text-destructive">
                Falha na publicação: {post.failure_reason}
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
                  {formatDateTime(event.created_at, settings.default_timezone)}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <p className="text-muted-foreground text-xs">
        Criado em {formatDate(post.created_at, settings.default_timezone)}.
        Contas conectadas publicam automaticamente no horário agendado.
      </p>
    </div>
  )
}

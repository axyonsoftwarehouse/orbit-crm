"use client"

import { Copy, ExternalLink, Share2, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { buildSocialShareLinks } from "@/lib/social-share"
import { markSocialPostPublishedAction } from "@/server/actions/social"

export function ManualPublishPanel({
  postId,
  content,
}: {
  postId: string
  content: string
}) {
  const links = buildSocialShareLinks(content)

  async function copyContent() {
    try {
      await navigator.clipboard.writeText(content)
      toast.success("Conteúdo copiado.")
    } catch {
      toast.error("Não foi possível copiar o conteúdo.")
    }
  }

  async function shareContent() {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ text: content })
        return
      } catch {
        // usuário cancelou ou o navegador não concluiu
      }
    }
    await copyContent()
  }

  return (
    <div className="bg-card space-y-4 rounded-xl border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">Publicação manual</p>
          <p className="text-muted-foreground text-xs">
            Copie o conteúdo ou abra a rede, publique e confirme abaixo.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={copyContent}
          >
            <Copy className="size-3.5" />
            Copiar conteúdo
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={shareContent}
          >
            <Share2 className="size-3.5" />
            Compartilhar
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {links.map((link) => (
          <Button
            key={link.provider}
            size="sm"
            variant="secondary"
            nativeButton={false}
            render={<a href={link.url} target="_blank" rel="noreferrer" />}
          >
            <ExternalLink className="size-3.5" />
            {link.label}
          </Button>
        ))}
      </div>

      <p className="text-muted-foreground text-xs">
        Instagram e TikTok não possuem link de composição: copie o conteúdo e
        publique pelo app. Facebook e LinkedIn aparecem como compartilhamento de
        link quando o post contém uma URL.
      </p>

      <form action={markSocialPostPublishedAction}>
        <input type="hidden" name="id" value={postId} />
        <Button type="submit" size="sm">
          <CheckCircle2 className="size-3.5" />
          Marcar como publicado
        </Button>
      </form>
    </div>
  )
}

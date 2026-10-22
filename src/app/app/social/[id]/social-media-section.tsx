import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { listSocialMedia } from "@/server/queries/social"
import { DeleteSocialMediaButton } from "./delete-social-media-button"
import { SocialMediaUploader } from "./social-media-uploader"

export async function SocialMediaSection({
  tenantId,
  postId,
}: {
  tenantId: string
  postId: string
}) {
  const media = await listSocialMedia(tenantId, postId)

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-base">Mídia</CardTitle>
        <SocialMediaUploader tenantId={tenantId} postId={postId} />
      </CardHeader>
      <CardContent>
        {media.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Nenhuma imagem adicionada. Use “Adicionar imagem” para preparar o
            post.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {media.map((item) => (
              <div
                key={item.id}
                className="group relative overflow-hidden rounded-xl border"
              >
                {item.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.url}
                    alt={item.alt_text ?? item.file_name}
                    className="aspect-square w-full object-cover"
                  />
                ) : (
                  <div className="bg-muted aspect-square w-full" />
                )}
                <div className="absolute top-1 right-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <DeleteSocialMediaButton id={item.id} postId={postId} />
                </div>
                <p className="truncate bg-black/60 px-2 py-1 text-[10px] text-white">
                  {item.file_name}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

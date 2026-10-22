import { SOCIAL_PROVIDER_LIMITS, SOCIAL_PROVIDERS } from "@/lib/constants"
import { cn } from "@/lib/utils"

type PreviewMedia = {
  url: string | null
  alt?: string | null
}

export function SocialPreview({
  provider,
  content,
  media = [],
}: {
  provider: string
  content: string
  media?: PreviewMedia[]
}) {
  const key = provider as keyof typeof SOCIAL_PROVIDERS
  const label = SOCIAL_PROVIDERS[key]?.label ?? provider
  const limit = SOCIAL_PROVIDER_LIMITS[key] ?? 5000
  const over = content.length > limit
  const images = media.filter((item) => item.url)

  return (
    <div className="bg-card overflow-hidden rounded-xl border">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="text-xs font-semibold">{label}</span>
        <span
          className={cn(
            "text-[10px]",
            over ? "text-destructive font-semibold" : "text-muted-foreground",
          )}
        >
          {content.length}/{limit}
        </span>
      </div>
      <div className="space-y-2 p-3">
        <p className="line-clamp-6 text-sm whitespace-pre-wrap">
          {content || "O conteúdo do post aparecerá aqui."}
        </p>
        {images.length > 0 ? (
          <div
            className={cn(
              "grid gap-1",
              images.length === 1 ? "grid-cols-1" : "grid-cols-2",
            )}
          >
            {images.slice(0, 4).map((item, index) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={index}
                src={item.url ?? ""}
                alt={item.alt ?? `Imagem ${index + 1}`}
                className="max-h-48 w-full rounded-lg object-cover"
              />
            ))}
          </div>
        ) : null}
        {over ? (
          <p className="text-destructive text-[10px]">
            O texto excede o limite desta rede.
          </p>
        ) : null}
      </div>
    </div>
  )
}

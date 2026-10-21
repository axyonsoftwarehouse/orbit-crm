import { Badge } from "@/components/ui/badge"
import {
  SOCIAL_POST_STATUSES,
  SOCIAL_PROVIDERS,
  type SocialPostStatus,
} from "@/lib/constants"

export function SocialStatusBadge({ status }: { status: string }) {
  const config =
    SOCIAL_POST_STATUSES[status as SocialPostStatus] ??
    SOCIAL_POST_STATUSES.draft

  return (
    <Badge variant="outline" className="gap-1.5">
      <span
        className="size-2 rounded-full"
        style={{ backgroundColor: config.color }}
      />
      {config.label}
    </Badge>
  )
}

export function SocialProviderBadge({ provider }: { provider: string }) {
  const label =
    SOCIAL_PROVIDERS[provider as keyof typeof SOCIAL_PROVIDERS]?.label ??
    provider

  return <Badge variant="secondary">{label}</Badge>
}

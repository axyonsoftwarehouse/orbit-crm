import type { SocialProvider, SocialProviderId } from "./provider"
import { instagramProvider } from "./providers/instagram"
import { linkedinProvider } from "./providers/linkedin"

const providers: Record<SocialProviderId, SocialProvider> = {
  instagram: instagramProvider,
  linkedin: linkedinProvider,
}

export function isNativeSocialProvider(
  value: string,
): value is SocialProviderId {
  return value === "instagram" || value === "linkedin"
}

export function getSocialProvider(value: string): SocialProvider | null {
  return isNativeSocialProvider(value) ? providers[value] : null
}

export function nativeSocialProviders(): SocialProvider[] {
  return Object.values(providers)
}

export type { SocialProvider, SocialProviderId }

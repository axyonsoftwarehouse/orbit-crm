export type SocialProviderId = "instagram" | "linkedin"

export type SocialAccountType = "instagram" | "member" | "organization"

export type OAuthTokenSet = {
  accessToken: string
  refreshToken: string | null
  expiresAt: string | null
  scopes: string[]
}

export type SocialProfile = {
  id: string
  name: string
  avatarUrl: string | null
  accountType: SocialAccountType
  metadata: Record<string, unknown>
}

export type SocialPublishMedia = {
  url: string
  fileName: string
  mimeType: string | null
}

export type SocialPublishInput = {
  content: string
  media: SocialPublishMedia[]
  profile: SocialProfile
  tokens: OAuthTokenSet
}

export type SocialPublishResult = {
  externalId: string
  metadata?: Record<string, unknown>
}

export type SocialConnectInput = {
  redirectUri: string
  state: string
  accountType?: SocialAccountType
}

export type SocialExchangeInput = {
  code: string
  redirectUri: string
  accountType?: SocialAccountType
}

export interface SocialProvider {
  id: SocialProviderId
  label: string
  isConfigured: boolean
  supportsAccountType(type: SocialAccountType): boolean
  getAuthUrl(input: SocialConnectInput): string
  exchangeCode(
    input: SocialExchangeInput,
  ): Promise<{ tokens: OAuthTokenSet; profile: SocialProfile }>
  refreshTokens(tokens: OAuthTokenSet): Promise<OAuthTokenSet>
  publish(input: SocialPublishInput): Promise<SocialPublishResult>
}

export class SocialProviderError extends Error {
  status: number | null

  constructor(message: string, status: number | null = null) {
    super(message)
    this.name = "SocialProviderError"
    this.status = status
  }
}

function errorMessage(body: unknown, fallback: string): string {
  if (typeof body === "string" && body.trim()) return body
  if (body && typeof body === "object") {
    const obj = body as Record<string, unknown>
    const error = obj.error
    if (typeof error === "string") {
      const description = obj.error_description
      return typeof description === "string" && description
        ? description
        : error
    }
    if (error && typeof error === "object") {
      const inner = error as Record<string, unknown>
      if (typeof inner.message === "string") return inner.message
    }
    if (typeof obj.message === "string") return obj.message
  }
  return fallback
}

export async function readProviderResponse(
  response: Response,
): Promise<Record<string, unknown>> {
  const text = await response.text()
  let parsed: unknown = null
  if (text) {
    try {
      parsed = JSON.parse(text)
    } catch {
      parsed = text
    }
  }

  if (!response.ok) {
    throw new SocialProviderError(
      errorMessage(parsed, `Falha na API (HTTP ${response.status}).`),
      response.status,
    )
  }

  return (parsed ?? {}) as Record<string, unknown>
}

export function secondsFromNow(seconds: unknown): string | null {
  const value = Number(seconds)
  if (!Number.isFinite(value) || value <= 0) return null
  return new Date(Date.now() + value * 1000).toISOString()
}

export function splitScopes(scope: unknown): string[] {
  if (typeof scope !== "string") return []
  return scope
    .split(/[,\s]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

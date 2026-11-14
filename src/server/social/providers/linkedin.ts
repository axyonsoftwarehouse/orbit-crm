import { env } from "@/lib/env"
import {
  readProviderResponse,
  secondsFromNow,
  SocialProviderError,
  splitScopes,
  type OAuthTokenSet,
  type SocialAccountType,
  type SocialConnectInput,
  type SocialExchangeInput,
  type SocialProfile,
  type SocialProvider,
  type SocialPublishInput,
  type SocialPublishResult,
} from "@/server/social/provider"

const AUTHORIZE_URL = "https://www.linkedin.com/oauth/v2/authorization"
const TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken"
const API_URL = "https://api.linkedin.com"
const MEMBER_SCOPES = ["openid", "profile", "w_member_social"]
const ORGANIZATION_SCOPES = [
  "openid",
  "profile",
  "w_member_social",
  "w_organization_social",
  "r_organization_social",
  "rw_organization_admin",
]

function configured(): boolean {
  return Boolean(env().LINKEDIN_CLIENT_ID && env().LINKEDIN_CLIENT_SECRET)
}

function scopesFor(type: SocialAccountType | undefined): string[] {
  return type === "organization" ? ORGANIZATION_SCOPES : MEMBER_SCOPES
}

function headers(accessToken: string): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    "LinkedIn-Version": env().LINKEDIN_API_VERSION,
    "X-Restli-Protocol-Version": "2.0.0",
  }
}

function organizationId(urn: string): string {
  const value = urn.trim()
  const prefix = "urn:li:organization:"
  return value.startsWith(prefix) ? value.slice(prefix.length) : value
}

async function fetchOrganization(
  accessToken: string,
): Promise<{ urn: string; name: string }> {
  const fixed = env().LINKEDIN_ORGANIZATION_URN
  if (fixed) {
    return { urn: fixed, name: "Página LinkedIn" }
  }

  const url = new URL(`${API_URL}/v2/organizationalEntityAcls`)
  url.searchParams.set("q", "roleAssignee")
  url.searchParams.set("role", "ADMINISTRATOR")
  url.searchParams.set("state", "APPROVED")
  const data = await readProviderResponse(
    await fetch(url, { headers: headers(accessToken), cache: "no-store" }),
  )

  const elements = Array.isArray(data.elements) ? data.elements : []
  const first = elements[0] as Record<string, unknown> | undefined
  const urn =
    first && typeof first.organizationalTarget === "string"
      ? first.organizationalTarget
      : ""
  if (!urn) {
    throw new SocialProviderError(
      "Nenhuma Página do LinkedIn administrada foi encontrada.",
    )
  }

  const details = first?.["organizationalTarget~"] as
    Record<string, unknown> | undefined
  const name =
    details && typeof details.localizedName === "string"
      ? details.localizedName
      : "Página LinkedIn"

  return { urn, name }
}

function authorUrn(profile: SocialProfile): string {
  const stored = profile.metadata.author_urn
  if (typeof stored === "string" && stored) return stored
  if (profile.accountType === "organization") {
    return `urn:li:organization:${organizationId(profile.id)}`
  }
  return `urn:li:person:${profile.id}`
}

export const linkedinProvider: SocialProvider = {
  id: "linkedin",
  label: "LinkedIn",
  get isConfigured() {
    return configured()
  },

  supportsAccountType(type) {
    return type === "member" || type === "organization"
  },

  getAuthUrl(input: SocialConnectInput) {
    const params = new URLSearchParams({
      response_type: "code",
      client_id: env().LINKEDIN_CLIENT_ID ?? "",
      redirect_uri: input.redirectUri,
      state: input.state,
      scope: scopesFor(input.accountType).join(" "),
    })
    return `${AUTHORIZE_URL}?${params.toString()}`
  },

  async exchangeCode(input: SocialExchangeInput) {
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code: input.code,
      redirect_uri: input.redirectUri,
      client_id: env().LINKEDIN_CLIENT_ID ?? "",
      client_secret: env().LINKEDIN_CLIENT_SECRET ?? "",
    })
    const token = await readProviderResponse(
      await fetch(TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
        cache: "no-store",
      }),
    )

    const accessToken =
      typeof token.access_token === "string" ? token.access_token : ""
    if (!accessToken) {
      throw new SocialProviderError("LinkedIn não retornou o token de acesso.")
    }

    const user = await readProviderResponse(
      await fetch(`${API_URL}/v2/userinfo`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      }),
    )
    const subject = typeof user.sub === "string" ? user.sub : ""
    if (!subject) {
      throw new SocialProviderError("LinkedIn não retornou o id do usuário.")
    }

    const accountType: SocialAccountType =
      input.accountType === "organization" ? "organization" : "member"
    const organization =
      accountType === "organization"
        ? await fetchOrganization(accessToken)
        : null

    return {
      tokens: {
        accessToken,
        refreshToken:
          typeof token.refresh_token === "string" ? token.refresh_token : null,
        expiresAt: secondsFromNow(token.expires_in),
        scopes: splitScopes(token.scope).length
          ? splitScopes(token.scope)
          : scopesFor(accountType),
      },
      profile: {
        id:
          accountType === "organization" && organization
            ? organizationId(organization.urn)
            : subject,
        name:
          accountType === "organization" && organization
            ? organization.name
            : typeof user.name === "string" && user.name
              ? user.name
              : subject,
        avatarUrl:
          typeof user.picture === "string" && user.picture
            ? user.picture
            : null,
        accountType,
        metadata:
          accountType === "organization" && organization
            ? { author_urn: organization.urn }
            : {
                author_urn: `urn:li:person:${subject}`,
                person_sub: subject,
              },
      },
    }
  },

  async refreshTokens(tokens: OAuthTokenSet) {
    if (!tokens.refreshToken) {
      throw new SocialProviderError(
        "LinkedIn não retornou refresh token; reconecte a conta.",
      )
    }
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: tokens.refreshToken,
      client_id: env().LINKEDIN_CLIENT_ID ?? "",
      client_secret: env().LINKEDIN_CLIENT_SECRET ?? "",
    })
    const token = await readProviderResponse(
      await fetch(TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
        cache: "no-store",
      }),
    )
    const accessToken =
      typeof token.access_token === "string" ? token.access_token : ""
    if (!accessToken) {
      throw new SocialProviderError("LinkedIn não renovou o token.")
    }
    return {
      ...tokens,
      accessToken,
      refreshToken:
        typeof token.refresh_token === "string"
          ? token.refresh_token
          : tokens.refreshToken,
      expiresAt: secondsFromNow(token.expires_in),
    }
  },

  async publish(input: SocialPublishInput): Promise<SocialPublishResult> {
    if (input.content.length > 3000) {
      throw new SocialProviderError(
        "O texto excede o limite de 3.000 caracteres do LinkedIn.",
      )
    }

    const author = authorUrn(input.profile)
    let imageUrn: string | null = null
    const media = input.media[0]

    if (media) {
      const initialize = await readProviderResponse(
        await fetch(`${API_URL}/rest/images?action=initializeUpload`, {
          method: "POST",
          headers: headers(input.tokens.accessToken),
          body: JSON.stringify({
            initializeUploadRequest: { owner: author },
          }),
          cache: "no-store",
        }),
      )
      const value = initialize.value as Record<string, unknown> | undefined
      const uploadUrl =
        value && typeof value.uploadUrl === "string" ? value.uploadUrl : ""
      const image = value && typeof value.image === "string" ? value.image : ""
      if (!uploadUrl || !image) {
        throw new SocialProviderError(
          "LinkedIn não preparou o upload da imagem.",
        )
      }

      const imageResponse = await fetch(media.url, { cache: "no-store" })
      if (!imageResponse.ok) {
        throw new SocialProviderError(
          "Não foi possível baixar a imagem para enviar ao LinkedIn.",
        )
      }
      const bytes = await imageResponse.arrayBuffer()
      const upload = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/octet-stream" },
        body: bytes,
      })
      if (!upload.ok) {
        throw new SocialProviderError(
          `Falha ao enviar a imagem ao LinkedIn (HTTP ${upload.status}).`,
          upload.status,
        )
      }
      imageUrn = image
    }

    const payload: Record<string, unknown> = {
      author,
      commentary: input.content,
      visibility: "PUBLIC",
      distribution: {
        feedDistribution: "MAIN_FEED",
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false,
    }
    if (imageUrn) {
      payload.content = { media: { id: imageUrn } }
    }

    const response = await fetch(`${API_URL}/rest/posts`, {
      method: "POST",
      headers: headers(input.tokens.accessToken),
      body: JSON.stringify(payload),
      cache: "no-store",
    })
    const text = await response.text()
    if (!response.ok) {
      throw new SocialProviderError(
        text || `Falha ao publicar no LinkedIn (HTTP ${response.status}).`,
        response.status,
      )
    }

    const externalId =
      response.headers.get("x-restli-id") ??
      response.headers.get("x-linkedin-id") ??
      `linkedin:${Date.now()}`

    return {
      externalId,
      metadata: { author_urn: author, image_urn: imageUrn },
    }
  },
}

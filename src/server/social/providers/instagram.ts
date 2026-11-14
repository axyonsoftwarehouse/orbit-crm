import { env } from "@/lib/env"
import {
  readProviderResponse,
  secondsFromNow,
  SocialProviderError,
  splitScopes,
  type OAuthTokenSet,
  type SocialConnectInput,
  type SocialExchangeInput,
  type SocialProvider,
  type SocialPublishInput,
  type SocialPublishResult,
} from "@/server/social/provider"

const AUTHORIZE_URL = "https://www.instagram.com/oauth/authorize"
const TOKEN_URL = "https://api.instagram.com/oauth/access_token"
const GRAPH_URL = "https://graph.instagram.com"
const SCOPES = [
  "instagram_business_basic",
  "instagram_business_content_publish",
]

function apiUrl(path: string): string {
  return `${GRAPH_URL}/${env().INSTAGRAM_API_VERSION}/${path}`
}

function configured(): boolean {
  return Boolean(env().INSTAGRAM_APP_ID && env().INSTAGRAM_APP_SECRET)
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function exchangeLongLivedToken(
  shortLivedToken: string,
): Promise<Record<string, unknown>> {
  const url = new URL(`${GRAPH_URL}/access_token`)
  url.searchParams.set("grant_type", "ig_exchange_token")
  url.searchParams.set("client_secret", env().INSTAGRAM_APP_SECRET ?? "")
  url.searchParams.set("access_token", shortLivedToken)
  return readProviderResponse(await fetch(url, { cache: "no-store" }))
}

async function mediaStatus(
  containerId: string,
  accessToken: string,
): Promise<string> {
  const url = new URL(apiUrl(containerId))
  url.searchParams.set("fields", "status_code")
  url.searchParams.set("access_token", accessToken)
  const data = await readProviderResponse(
    await fetch(url, { cache: "no-store" }),
  )
  return typeof data.status_code === "string" ? data.status_code : ""
}

export const instagramProvider: SocialProvider = {
  id: "instagram",
  label: "Instagram",
  get isConfigured() {
    return configured()
  },

  supportsAccountType(type) {
    return type === "instagram"
  },

  getAuthUrl(input: SocialConnectInput) {
    const params = new URLSearchParams({
      client_id: env().INSTAGRAM_APP_ID ?? "",
      redirect_uri: input.redirectUri,
      response_type: "code",
      scope: SCOPES.join(","),
      state: input.state,
    })
    return `${AUTHORIZE_URL}?${params.toString()}`
  },

  async exchangeCode(input: SocialExchangeInput) {
    const body = new URLSearchParams({
      client_id: env().INSTAGRAM_APP_ID ?? "",
      client_secret: env().INSTAGRAM_APP_SECRET ?? "",
      grant_type: "authorization_code",
      redirect_uri: input.redirectUri,
      code: input.code,
    })
    const short = await readProviderResponse(
      await fetch(TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
        cache: "no-store",
      }),
    )

    const shortToken =
      typeof short.access_token === "string" ? short.access_token : ""
    if (!shortToken) {
      throw new SocialProviderError("Instagram não retornou o token de acesso.")
    }

    const long = await exchangeLongLivedToken(shortToken)
    const accessToken =
      typeof long.access_token === "string" ? long.access_token : shortToken
    const expiresAt = secondsFromNow(long.expires_in)

    const profileUrl = new URL(apiUrl("me"))
    profileUrl.searchParams.set(
      "fields",
      "user_id,username,account_type,profile_picture_url",
    )
    profileUrl.searchParams.set("access_token", accessToken)
    const profile = await readProviderResponse(
      await fetch(profileUrl, { cache: "no-store" }),
    )

    const idValue = profile.user_id ?? profile.id
    const id = typeof idValue === "string" ? idValue : String(idValue ?? "")
    if (!id) {
      throw new SocialProviderError("Instagram não retornou o id da conta.")
    }

    const username =
      typeof profile.username === "string" && profile.username
        ? profile.username
        : id

    return {
      tokens: {
        accessToken,
        refreshToken: null,
        expiresAt,
        scopes: splitScopes(short.permissions).length
          ? splitScopes(short.permissions)
          : SCOPES,
      },
      profile: {
        id,
        name: username,
        avatarUrl:
          typeof profile.profile_picture_url === "string"
            ? profile.profile_picture_url
            : null,
        accountType: "instagram",
        metadata: {
          username,
          account_type:
            typeof profile.account_type === "string"
              ? profile.account_type
              : null,
        },
      },
    }
  },

  async refreshTokens(tokens: OAuthTokenSet) {
    const url = new URL(`${GRAPH_URL}/refresh_access_token`)
    url.searchParams.set("grant_type", "ig_refresh_token")
    url.searchParams.set("access_token", tokens.accessToken)
    const data = await readProviderResponse(
      await fetch(url, { cache: "no-store" }),
    )
    const accessToken =
      typeof data.access_token === "string" ? data.access_token : ""
    if (!accessToken) {
      throw new SocialProviderError("Instagram não renovou o token.")
    }
    return {
      ...tokens,
      accessToken,
      expiresAt: secondsFromNow(data.expires_in),
    }
  },

  async publish(input: SocialPublishInput): Promise<SocialPublishResult> {
    const media = input.media[0]
    if (!media) {
      throw new SocialProviderError(
        "O Instagram exige uma imagem para publicar.",
      )
    }

    const containerBody = new URLSearchParams({
      image_url: media.url,
      caption: input.content,
      access_token: input.tokens.accessToken,
    })
    const container = await readProviderResponse(
      await fetch(apiUrl(`${input.profile.id}/media`), {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: containerBody,
        cache: "no-store",
      }),
    )
    const containerId =
      typeof container.id === "string"
        ? container.id
        : String(container.id ?? "")
    if (!containerId) {
      throw new SocialProviderError(
        "Instagram não criou o container da publicação.",
      )
    }

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const status = await mediaStatus(containerId, input.tokens.accessToken)
      if (status === "FINISHED") break
      if (status === "ERROR") {
        throw new SocialProviderError(
          "O Instagram rejeitou a mídia da publicação.",
        )
      }
      await sleep(2000)
    }

    const publishBody = new URLSearchParams({
      creation_id: containerId,
      access_token: input.tokens.accessToken,
    })
    const published = await readProviderResponse(
      await fetch(apiUrl(`${input.profile.id}/media_publish`), {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: publishBody,
        cache: "no-store",
      }),
    )
    const externalId =
      typeof published.id === "string"
        ? published.id
        : String(published.id ?? "")
    if (!externalId) {
      throw new SocialProviderError(
        "Instagram não retornou o id da publicação.",
      )
    }

    return {
      externalId,
      metadata: { container_id: containerId },
    }
  },
}

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { SocialProviderError } from "@/server/social/provider"

const envState = vi.hoisted(() => ({
  linkedinUrn: undefined as string | undefined,
}))

vi.mock("@/lib/env", () => ({
  env: () => ({
    INSTAGRAM_APP_ID: "ig-app",
    INSTAGRAM_APP_SECRET: "ig-secret",
    INSTAGRAM_API_VERSION: "v23.0",
    LINKEDIN_CLIENT_ID: "li-client",
    LINKEDIN_CLIENT_SECRET: "li-secret",
    LINKEDIN_API_VERSION: "202601",
    LINKEDIN_ORGANIZATION_URN: envState.linkedinUrn,
  }),
}))

import { instagramProvider } from "@/server/social/providers/instagram"
import { linkedinProvider } from "@/server/social/providers/linkedin"

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

function mockFetch(responses: Response[]) {
  const queue = [...responses]
  const fetchMock = vi.fn<typeof fetch>(async () => {
    const response = queue.shift()
    if (!response) throw new Error("fetch inesperado")
    return response
  })
  vi.stubGlobal("fetch", fetchMock)
  return fetchMock
}

const tokens = {
  accessToken: "token",
  refreshToken: null,
  expiresAt: null,
  scopes: [],
}

const instagramProfile = {
  id: "1789",
  name: "orbit",
  avatarUrl: null,
  accountType: "instagram" as const,
  metadata: {},
}

const linkedinProfile = {
  id: "abc",
  name: "Werner",
  avatarUrl: null,
  accountType: "member" as const,
  metadata: { author_urn: "urn:li:person:abc" },
}

beforeEach(() => {
  envState.linkedinUrn = undefined
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("Instagram", () => {
  it("troca o código por token longo e perfil", async () => {
    const fetchMock = mockFetch([
      json({
        access_token: "short",
        permissions:
          "instagram_business_basic,instagram_business_content_publish",
      }),
      json({ access_token: "long-lived", expires_in: 5_184_000 }),
      json({
        user_id: "1789",
        username: "orbit",
        account_type: "BUSINESS",
        profile_picture_url: "https://cdn.example/avatar.jpg",
      }),
    ])

    const result = await instagramProvider.exchangeCode({
      code: "code",
      redirectUri: "https://app.example/api/social/callback/instagram",
      accountType: "instagram",
    })

    expect(result.tokens).toMatchObject({
      accessToken: "long-lived",
      refreshToken: null,
    })
    expect(result.tokens.expiresAt).toBeTruthy()
    expect(result.tokens.scopes).toEqual([
      "instagram_business_basic",
      "instagram_business_content_publish",
    ])
    expect(result.profile).toEqual({
      id: "1789",
      name: "orbit",
      avatarUrl: "https://cdn.example/avatar.jpg",
      accountType: "instagram",
      metadata: { username: "orbit", account_type: "BUSINESS" },
    })
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it("repassa a mensagem e o status do provedor no erro", async () => {
    mockFetch([
      json(
        { error: "invalid_grant", error_description: "código expirado" },
        400,
      ),
    ])

    const promise = instagramProvider.exchangeCode({
      code: "bad",
      redirectUri: "https://app.example/callback",
      accountType: "instagram",
    })

    await expect(promise).rejects.toBeInstanceOf(SocialProviderError)
    await expect(promise).rejects.toMatchObject({
      message: "código expirado",
      status: 400,
    })
  })

  it("exige imagem para publicar", async () => {
    const fetchMock = mockFetch([])

    await expect(
      instagramProvider.publish({
        content: "texto",
        media: [],
        profile: instagramProfile,
        tokens,
      }),
    ).rejects.toThrow("O Instagram exige uma imagem para publicar.")

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("cria o container, espera a mídia e publica", async () => {
    const fetchMock = mockFetch([
      json({ id: "container-1" }),
      json({ status_code: "FINISHED" }),
      json({ id: "post-1" }),
    ])

    const result = await instagramProvider.publish({
      content: "Olá",
      media: [
        {
          url: "https://cdn.example/img.jpg",
          fileName: "img.jpg",
          mimeType: "image/jpeg",
        },
      ],
      profile: instagramProfile,
      tokens,
    })

    expect(result).toEqual({
      externalId: "post-1",
      metadata: { container_id: "container-1" },
    })
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(String(fetchMock.mock.calls[0]?.[1]?.body)).toContain(
      "image_url=https%3A%2F%2Fcdn.example%2Fimg.jpg",
    )
  })

  it("aborta quando o container retorna ERROR", async () => {
    mockFetch([json({ id: "container-1" }), json({ status_code: "ERROR" })])

    await expect(
      instagramProvider.publish({
        content: "Olá",
        media: [
          {
            url: "https://cdn.example/img.jpg",
            fileName: "img.jpg",
            mimeType: "image/jpeg",
          },
        ],
        profile: instagramProfile,
        tokens,
      }),
    ).rejects.toThrow("O Instagram rejeitou a mídia da publicação.")
  })
})

describe("LinkedIn", () => {
  it("troca o código e lê o perfil pessoal", async () => {
    const fetchMock = mockFetch([
      json({
        access_token: "li-token",
        expires_in: 3600,
        scope: "openid profile w_member_social",
        refresh_token: "refresh",
      }),
      json({ sub: "abc", name: "Werner", picture: "https://pic.example" }),
    ])

    const result = await linkedinProvider.exchangeCode({
      code: "code",
      redirectUri: "https://app.example/api/social/callback/linkedin",
      accountType: "member",
    })

    expect(result.tokens).toMatchObject({
      accessToken: "li-token",
      refreshToken: "refresh",
      scopes: ["openid", "profile", "w_member_social"],
    })
    expect(result.profile).toEqual({
      id: "abc",
      name: "Werner",
      avatarUrl: "https://pic.example",
      accountType: "member",
      metadata: {
        author_urn: "urn:li:person:abc",
        person_sub: "abc",
      },
    })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it("usa a Página fixa de LINKEDIN_ORGANIZATION_URN", async () => {
    envState.linkedinUrn = "urn:li:organization:123"
    const fetchMock = mockFetch([
      json({ access_token: "li-token" }),
      json({ sub: "abc", name: "Werner" }),
    ])

    const result = await linkedinProvider.exchangeCode({
      code: "code",
      redirectUri: "https://app.example/callback",
      accountType: "organization",
    })

    expect(result.profile).toMatchObject({
      id: "123",
      name: "Página LinkedIn",
      accountType: "organization",
      metadata: { author_urn: "urn:li:organization:123" },
    })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it("recusa texto acima de 3.000 caracteres", async () => {
    const fetchMock = mockFetch([])

    await expect(
      linkedinProvider.publish({
        content: "x".repeat(3001),
        media: [],
        profile: linkedinProfile,
        tokens,
      }),
    ).rejects.toThrow("O texto excede o limite de 3.000 caracteres")

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("sobe a imagem e publica no perfil", async () => {
    const fetchMock = mockFetch([
      json({
        value: {
          uploadUrl: "https://upload.example/image",
          image: "urn:li:image:1",
        },
      }),
      new Response(new Uint8Array([1, 2, 3]), { status: 200 }),
      new Response(null, { status: 201 }),
      new Response("", {
        status: 201,
        headers: { "x-restli-id": "urn:li:share:1" },
      }),
    ])

    const result = await linkedinProvider.publish({
      content: "Olá",
      media: [
        {
          url: "https://cdn.example/img.jpg",
          fileName: "img.jpg",
          mimeType: "image/jpeg",
        },
      ],
      profile: linkedinProfile,
      tokens,
    })

    expect(result).toEqual({
      externalId: "urn:li:share:1",
      metadata: {
        author_urn: "urn:li:person:abc",
        image_urn: "urn:li:image:1",
      },
    })
    expect(fetchMock).toHaveBeenCalledTimes(4)

    const postBody = JSON.parse(String(fetchMock.mock.calls[3]?.[1]?.body))
    expect(postBody).toMatchObject({
      author: "urn:li:person:abc",
      commentary: "Olá",
      content: { media: { id: "urn:li:image:1" } },
    })
  })

  it("publica só texto quando não há imagem", async () => {
    const fetchMock = mockFetch([
      new Response("", {
        status: 201,
        headers: { "x-restli-id": "urn:li:share:2" },
      }),
    ])

    const result = await linkedinProvider.publish({
      content: "Só texto",
      media: [],
      profile: linkedinProfile,
      tokens,
    })

    expect(result.externalId).toBe("urn:li:share:2")
    const postBody = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))
    expect(postBody.content).toBeUndefined()
  })
})

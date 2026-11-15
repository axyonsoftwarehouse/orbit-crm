import { describe, expect, it } from "vitest"
import { zonedTimeToUtc } from "@/lib/timezone"
import {
  socialPublishIsFinalFailure,
  socialPublishNextAttemptAt,
} from "@/server/social/backoff"
import { splitScopes } from "@/server/social/provider"

describe("social publish backoff", () => {
  const now = Date.UTC(2026, 0, 1, 12, 0, 0)

  it("segue 1, 5, 15 e 60 minutos", () => {
    expect(socialPublishNextAttemptAt(1, now)).toBe(
      new Date(now + 60_000).toISOString(),
    )
    expect(socialPublishNextAttemptAt(2, now)).toBe(
      new Date(now + 5 * 60_000).toISOString(),
    )
    expect(socialPublishNextAttemptAt(3, now)).toBe(
      new Date(now + 15 * 60_000).toISOString(),
    )
    expect(socialPublishNextAttemptAt(4, now)).toBe(
      new Date(now + 60 * 60_000).toISOString(),
    )
  })

  it("mantém 60 minutos depois do limite", () => {
    expect(socialPublishNextAttemptAt(9, now)).toBe(
      new Date(now + 60 * 60_000).toISOString(),
    )
  })
})

describe("socialPublishIsFinalFailure", () => {
  it("trata 4xx como definitivo, exceto 429", () => {
    expect(socialPublishIsFinalFailure(400, 1)).toBe(true)
    expect(socialPublishIsFinalFailure(403, 1)).toBe(true)
    expect(socialPublishIsFinalFailure(429, 1)).toBe(false)
  })

  it("retenta 5xx, rede e tempo esgotado até o limite", () => {
    expect(socialPublishIsFinalFailure(500, 1)).toBe(false)
    expect(socialPublishIsFinalFailure(null, 3)).toBe(false)
    expect(socialPublishIsFinalFailure(null, 4)).toBe(true)
  })
})

describe("splitScopes", () => {
  it("separa por espaço e vírgula", () => {
    expect(splitScopes("openid profile,w_member_social")).toEqual([
      "openid",
      "profile",
      "w_member_social",
    ])
  })

  it("devolve vazio para valor inválido", () => {
    expect(splitScopes(null)).toEqual([])
  })
})

describe("zonedTimeToUtc", () => {
  it("converte São Paulo para UTC", () => {
    expect(
      zonedTimeToUtc("2026-11-13T10:00", "America/Sao_Paulo")?.toISOString(),
    ).toBe("2026-11-13T13:00:00.000Z")
  })

  it("mantém UTC quando o fuso é UTC", () => {
    expect(zonedTimeToUtc("2026-11-13T10:00", "UTC")?.toISOString()).toBe(
      "2026-11-13T10:00:00.000Z",
    )
  })

  it("rejeita formato inválido", () => {
    expect(zonedTimeToUtc("13/11/2026 10:00", "America/Sao_Paulo")).toBeNull()
  })
})

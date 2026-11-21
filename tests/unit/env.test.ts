import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const KEYS = [
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const

const ORIGINAL = Object.fromEntries(KEYS.map((key) => [key, process.env[key]]))

/** Carrega o módulo novo para limpar o cache interno de `env()`. */
async function loadEnv() {
  vi.resetModules()
  const mod = await import("@/lib/env")
  return mod.env
}

describe("env", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co"
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon"
    delete process.env.RESEND_API_KEY
    delete process.env.EMAIL_FROM
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
  })

  afterEach(() => {
    for (const key of KEYS) {
      const value = ORIGINAL[key]
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  })

  it("trata RESEND_API_KEY vazia como ausente", async () => {
    process.env.RESEND_API_KEY = ""
    const env = await loadEnv()
    expect(env().RESEND_API_KEY).toBeUndefined()
  })

  it("trata EMAIL_FROM vazio como ausente", async () => {
    process.env.EMAIL_FROM = ""
    const env = await loadEnv()
    expect(env().EMAIL_FROM).toBeUndefined()
  })

  it("trata SUPABASE_SERVICE_ROLE_KEY vazia como ausente", async () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = ""
    const env = await loadEnv()
    expect(env().SUPABASE_SERVICE_ROLE_KEY).toBeUndefined()
  })

  it("mantém os valores quando informados", async () => {
    process.env.RESEND_API_KEY = "re_123"
    process.env.EMAIL_FROM = "nao-responda@orbit.test"
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service"
    const env = await loadEnv()
    expect(env()).toMatchObject({
      RESEND_API_KEY: "re_123",
      EMAIL_FROM: "nao-responda@orbit.test",
      SUPABASE_SERVICE_ROLE_KEY: "service",
    })
  })
})

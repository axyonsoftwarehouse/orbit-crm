import { beforeEach, describe, expect, it, vi } from "vitest"
import { createSupabaseMock } from "./supabase-mock"

const state = vi.hoisted(() => ({
  supabase: null as unknown,
  admin: null as unknown,
  limited: [] as string[],
}))

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => state.supabase,
}))
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => state.admin,
}))
vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn(async () => ({ sent: true })),
}))
vi.mock("@/server/rate-limit", () => ({
  getClientIp: async () => "203.0.113.9",
  hashIdentifier: (value: string) => `hash(${value})`,
  isRateLimited: vi.fn(async (bucket: string) =>
    state.limited.some((prefix) => bucket.startsWith(prefix)),
  ),
}))
vi.mock("next/headers", () => ({ headers: async () => new Headers() }))
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`)
  }),
}))
vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

import { sendEmail } from "@/lib/email"
import { isRateLimited } from "@/server/rate-limit"
import {
  requestPasswordResetAction,
  resetPasswordAction,
} from "@/server/actions/password"

function form(values: Record<string, string>) {
  const data = new FormData()
  for (const [key, value] of Object.entries(values)) data.set(key, value)
  return data
}

beforeEach(() => {
  state.limited = []
  process.env.NEXT_PUBLIC_SITE_URL = "https://crm.test"
  vi.mocked(sendEmail).mockClear()
  vi.mocked(isRateLimited).mockClear()
})

describe("requestPasswordResetAction", () => {
  function setup(
    result: { data: unknown; error: unknown } = {
      data: { properties: { hashed_token: "hash+abc/1" } },
      error: null,
    },
  ) {
    const generateLink = vi.fn(async () => result)
    const admin = createSupabaseMock()
    Object.assign(admin.client, { auth: { admin: { generateLink } } })
    state.admin = admin.client
    return generateLink
  }

  it("manda o link de recuperação da área certa", async () => {
    const generateLink = setup()

    const result = await requestPasswordResetAction(
      undefined,
      form({ email: " Marina@Padaria.test ", area: "portal" }),
    )

    expect(result?.success).toMatch(/Se houver uma conta/)
    expect(generateLink).toHaveBeenCalledWith({
      type: "recovery",
      email: "marina@padaria.test",
    })
    const email = vi.mocked(sendEmail).mock.calls[0][0]
    expect(email.to).toBe("marina@padaria.test")
    expect(email.subject).toMatch(/portal do cliente/)
    expect(email.html).toContain(
      "https://crm.test/portal/redefinir-senha?token=hash%2Babc%2F1",
    )
    expect(isRateLimited).toHaveBeenCalledWith(
      "reset:email:hash(marina@padaria.test)",
      3,
      3600,
    )
  })

  it("equipe recebe o link de /redefinir-senha", async () => {
    setup()

    await requestPasswordResetAction(
      undefined,
      form({ email: "dono@orbit.test", area: "app" }),
    )

    expect(vi.mocked(sendEmail).mock.calls[0][0].html).toContain(
      "https://crm.test/redefinir-senha?token=",
    )
  })

  it("e-mail sem conta tem a mesma resposta e não manda nada", async () => {
    setup({ data: null, error: { message: "User not found" } })

    const result = await requestPasswordResetAction(
      undefined,
      form({ email: "ninguem@x.test", area: "app" }),
    )

    expect(result?.success).toMatch(/Se houver uma conta/)
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it("respeita o limite por IP e por e-mail", async () => {
    const generateLink = setup()
    state.limited = ["reset:email:"]

    const result = await requestPasswordResetAction(
      undefined,
      form({ email: "dono@orbit.test", area: "app" }),
    )

    expect(result?.error).toMatch(/Muitos pedidos/)
    expect(generateLink).not.toHaveBeenCalled()
  })

  it("e-mail inválido é recusado", async () => {
    setup()
    const result = await requestPasswordResetAction(
      undefined,
      form({ email: "nao-e-email", area: "app" }),
    )
    expect(result?.error).toBe("Informe um e-mail válido.")
  })
})

describe("resetPasswordAction", () => {
  function setup(
    options: {
      verifyError?: unknown
      updateError?: unknown
    } = {},
  ) {
    const verifyOtp = vi.fn(async () => ({
      error: options.verifyError ?? null,
    }))
    const updateUser = vi.fn(async () => ({
      error: options.updateError ?? null,
    }))
    const supabase = createSupabaseMock()
    Object.assign(supabase.client, { auth: { verifyOtp, updateUser } })
    state.supabase = supabase.client
    return { verifyOtp, updateUser }
  }

  const submit = (values: Record<string, string> = {}) =>
    resetPasswordAction(
      undefined,
      form({
        token: "tok",
        area: "portal",
        password: "NovaSenha1",
        confirm: "NovaSenha1",
        ...values,
      }),
    )

  it("consome o token só no envio, troca a senha e volta para a área", async () => {
    const { verifyOtp, updateUser } = setup()

    await expect(submit()).rejects.toThrow("REDIRECT:/portal")
    expect(verifyOtp).toHaveBeenCalledWith({
      type: "recovery",
      token_hash: "tok",
    })
    expect(updateUser).toHaveBeenCalledWith({ password: "NovaSenha1" })

    await expect(submit({ area: "app" })).rejects.toThrow("REDIRECT:/app")
  })

  it("senhas que não conferem não gastam o token", async () => {
    const { verifyOtp } = setup()

    const result = await submit({ confirm: "Diferente1" })

    expect(result).toEqual({ error: "As senhas não conferem." })
    expect(verifyOtp).not.toHaveBeenCalled()
  })

  it("token inválido ou expirado pede um novo link", async () => {
    const { updateUser } = setup({ verifyError: { message: "expired" } })

    const result = await submit()

    expect(result).toEqual({
      error: "Este link é inválido ou expirou. Peça um novo.",
      needsNewLink: true,
    })
    expect(updateUser).not.toHaveBeenCalled()
  })

  it("senha igual à atual tem mensagem própria", async () => {
    setup({ updateError: { code: "same_password", message: "same" } })

    const result = await submit()

    expect(result?.error).toMatch(/diferente da atual/)
  })

  it("sem token nem tenta verificar", async () => {
    const { verifyOtp } = setup()
    const result = await submit({ token: "" })
    expect(result?.needsNewLink).toBe(true)
    expect(verifyOtp).not.toHaveBeenCalled()
  })
})

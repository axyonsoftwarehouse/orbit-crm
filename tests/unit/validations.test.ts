import { describe, expect, it } from "vitest"
import { signInSchema } from "@/lib/validations/auth"

describe("signInSchema", () => {
  it("aceita e-mail e senha válidos", () => {
    const result = signInSchema.safeParse({
      email: "user@orbit.test",
      password: "segredo123",
    })
    expect(result.success).toBe(true)
  })

  it("rejeita e-mail inválido", () => {
    const result = signInSchema.safeParse({
      email: "nao-e-email",
      password: "segredo123",
    })
    expect(result.success).toBe(false)
  })

  it("rejeita senha curta", () => {
    const result = signInSchema.safeParse({
      email: "user@orbit.test",
      password: "123",
    })
    expect(result.success).toBe(false)
  })
})

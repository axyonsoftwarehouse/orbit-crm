import { describe, expect, it } from "vitest"
import { signInSchema } from "@/lib/validations/auth"
import { milestoneSchema } from "@/lib/validations/milestones"
import { tagSchema } from "@/lib/validations/tags"
import { customFieldDefinitionSchema } from "@/lib/validations/custom-fields"

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

describe("milestoneSchema", () => {
  const base = {
    project_id: "4f8b2c1a-0000-4000-8000-000000000000",
    name: "Entrega do MVP",
  }

  it("aceita um marco válido com defaults", () => {
    const result = milestoneSchema.safeParse(base)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.status).toBe(1)
      expect(result.data.color).toBe("#0062FF")
    }
  })

  it("rejeita nome vazio", () => {
    const result = milestoneSchema.safeParse({ ...base, name: "  " })
    expect(result.success).toBe(false)
  })

  it("rejeita status fora de 1–3", () => {
    const result = milestoneSchema.safeParse({ ...base, status: 4 })
    expect(result.success).toBe(false)
  })

  it("rejeita cor inválida", () => {
    const result = milestoneSchema.safeParse({ ...base, color: "azul" })
    expect(result.success).toBe(false)
  })
})

describe("tagSchema", () => {
  it("aceita nome válido com cor padrão", () => {
    const result = tagSchema.safeParse({ name: "Urgente" })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.color).toBe("#0062FF")
  })

  it("rejeita nome vazio", () => {
    const result = tagSchema.safeParse({ name: "   " })
    expect(result.success).toBe(false)
  })

  it("rejeita cor inválida", () => {
    const result = tagSchema.safeParse({ name: "VIP", color: "vermelho" })
    expect(result.success).toBe(false)
  })
})

describe("customFieldDefinitionSchema", () => {
  const base = { entity_type: "company", label: "Segmento", key: "segmento" }

  it("aceita um campo válido com defaults", () => {
    const result = customFieldDefinitionSchema.safeParse(base)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.field_type).toBe("text")
      expect(result.data.required).toBe(false)
      expect(result.data.options).toEqual([])
    }
  })

  it("rejeita chave com caracteres inválidos", () => {
    const result = customFieldDefinitionSchema.safeParse({
      ...base,
      key: "Segmento A",
    })
    expect(result.success).toBe(false)
  })

  it("rejeita entidade fora do conjunto", () => {
    const result = customFieldDefinitionSchema.safeParse({
      ...base,
      entity_type: "invoice",
    })
    expect(result.success).toBe(false)
  })
})

import { describe, expect, it } from "vitest"
import { signInSchema } from "@/lib/validations/auth"
import { milestoneSchema } from "@/lib/validations/milestones"
import { tagSchema } from "@/lib/validations/tags"
import { customFieldDefinitionSchema } from "@/lib/validations/custom-fields"
import { tenantSettingsSchema } from "@/lib/validations/tenant"
import { expenseSchema } from "@/lib/validations/expenses"
import { contractSchema } from "@/lib/validations/contracts"
import { calendarEventSchema } from "@/lib/validations/calendar"
import {
  acceptInvitationSchema,
  inviteMemberSchema,
} from "@/lib/validations/team"

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

describe("tenantSettingsSchema", () => {
  it("aceita nome e cor válidos", () => {
    const result = tenantSettingsSchema.safeParse({
      name: "Minha Empresa",
      primary_color: "#ff0000",
    })
    expect(result.success).toBe(true)
  })

  it("rejeita cor inválida", () => {
    const result = tenantSettingsSchema.safeParse({
      name: "Empresa",
      primary_color: "vermelho",
    })
    expect(result.success).toBe(false)
  })
})

describe("team schemas", () => {
  it("normaliza e-mail e define papel padrão", () => {
    const result = inviteMemberSchema.safeParse({ email: " User@Orbit.TEST " })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.email).toBe("user@orbit.test")
      expect(result.data.role).toBe("member")
    }
  })

  it("rejeita papel inválido", () => {
    const result = inviteMemberSchema.safeParse({
      email: "user@orbit.test",
      role: "owner",
    })
    expect(result.success).toBe(false)
  })

  it("exige senha com ao menos 8 caracteres", () => {
    const result = acceptInvitationSchema.safeParse({
      full_name: "Fulano",
      password: "123",
    })
    expect(result.success).toBe(false)
  })
})

describe("expenseSchema", () => {
  it("aceita despesa válida e converte o valor", () => {
    const result = expenseSchema.safeParse({
      title: "Hosting",
      amount: "100.50",
      date: "2026-01-01",
    })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.amount).toBe(100.5)
  })

  it("rejeita valor negativo", () => {
    const result = expenseSchema.safeParse({
      title: "Hosting",
      amount: "-1",
      date: "2026-01-01",
    })
    expect(result.success).toBe(false)
  })

  it("rejeita título vazio", () => {
    const result = expenseSchema.safeParse({
      title: "  ",
      amount: "1",
      date: "2026-01-01",
    })
    expect(result.success).toBe(false)
  })
})

describe("contractSchema", () => {
  it("aceita contrato válido com status padrão", () => {
    const result = contractSchema.safeParse({ title: "Contrato A" })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.status).toBe(1)
  })

  it("rejeita título vazio", () => {
    expect(contractSchema.safeParse({ title: "  " }).success).toBe(false)
  })

  it("rejeita status fora de 1–3", () => {
    const result = contractSchema.safeParse({ title: "x", status: 9 })
    expect(result.success).toBe(false)
  })
})

describe("calendarEventSchema", () => {
  it("aceita evento válido", () => {
    const result = calendarEventSchema.safeParse({
      title: "Reunião",
      start_at: "2026-01-01T10:00",
    })
    expect(result.success).toBe(true)
  })

  it("rejeita título vazio", () => {
    const result = calendarEventSchema.safeParse({
      title: "  ",
      start_at: "2026-01-01T10:00",
    })
    expect(result.success).toBe(false)
  })

  it("rejeita início vazio", () => {
    const result = calendarEventSchema.safeParse({
      title: "Evento",
      start_at: "",
    })
    expect(result.success).toBe(false)
  })
})

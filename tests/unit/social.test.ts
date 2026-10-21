import { describe, expect, it } from "vitest"
import { SOCIAL_POST_STATUSES } from "@/lib/constants"
import { socialAccountSchema, socialPostSchema } from "@/lib/validations/social"

describe("social post schema", () => {
  it("aceita um post válido", () => {
    const result = socialPostSchema.safeParse({
      company_id: "00000000-0000-4000-8000-000000000001",
      content: "Novo post",
      target_ids: ["00000000-0000-4000-8000-000000000002"],
      requires_approval: true,
    })

    expect(result.success).toBe(true)
  })

  it("exige conteúdo e pelo menos uma conta", () => {
    const result = socialPostSchema.safeParse({
      company_id: "00000000-0000-4000-8000-000000000001",
      content: " ",
      target_ids: [],
      requires_approval: true,
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.message)).toContain(
        "Escreva o conteúdo do post",
      )
      expect(result.error.issues.map((issue) => issue.message)).toContain(
        "Selecione pelo menos uma conta",
      )
    }
  })
})

describe("social account schema", () => {
  it("aceita uma conta válida", () => {
    const result = socialAccountSchema.safeParse({
      provider: "linkedin",
      provider_account_id: "abc123",
      display_name: "Orbit CRM",
    })
    expect(result.success).toBe(true)
  })

  it("rejeita provedor desconhecido", () => {
    const result = socialAccountSchema.safeParse({
      provider: "myspace",
      provider_account_id: "abc123",
      display_name: "Orbit CRM",
    })
    expect(result.success).toBe(false)
  })
})

describe("social post statuses", () => {
  it("tem os status principais", () => {
    expect(SOCIAL_POST_STATUSES.draft.label).toBe("Rascunho")
    expect(SOCIAL_POST_STATUSES.pending_approval.label).toBe(
      "Aguardando aprovação",
    )
    expect(SOCIAL_POST_STATUSES.scheduled.label).toBe("Agendado")
    expect(SOCIAL_POST_STATUSES.published.label).toBe("Publicado")
  })
})

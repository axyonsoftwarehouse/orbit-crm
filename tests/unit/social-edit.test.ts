import { describe, expect, it } from "vitest"
import {
  editResetsApproval,
  isSocialPostEditable,
  publishModeNotice,
} from "@/lib/social-edit"

describe("isSocialPostEditable", () => {
  it("libera rascunho, rejeitado, aprovado e agendado", () => {
    for (const status of ["draft", "rejected", "approved", "scheduled"]) {
      expect(isSocialPostEditable(status)).toBe(true)
    }
  })

  it("bloqueia em aprovação e depois de publicar ou cancelar", () => {
    for (const status of [
      "pending_approval",
      "publishing",
      "published",
      "partially_published",
      "failed",
      "cancelled",
    ]) {
      expect(isSocialPostEditable(status)).toBe(false)
    }
  })
})

describe("editResetsApproval", () => {
  it("desfaz a aprovação de aprovado/agendado quando o post exige aprovação", () => {
    expect(editResetsApproval("approved", true)).toBe(true)
    expect(editResetsApproval("scheduled", true)).toBe(true)
  })

  it("mantém o status sem aprovação exigida ou antes de aprovar", () => {
    expect(editResetsApproval("scheduled", false)).toBe(false)
    expect(editResetsApproval("draft", true)).toBe(false)
    expect(editResetsApproval("rejected", true)).toBe(false)
  })
})

describe("publishModeNotice", () => {
  it("só redes conectadas com publicação nativa: automático", () => {
    expect(publishModeNotice(["instagram", "linkedin"], true)).toMatch(
      /publicam automaticamente/,
    )
  })

  it("contas manuais (ou nativo desligado): publicação pela agência", () => {
    expect(publishModeNotice(["facebook"], true)).toMatch(
      /^A publicação é feita pela agência/,
    )
    expect(publishModeNotice(["instagram"], false)).toMatch(
      /^A publicação é feita pela agência/,
    )
  })

  it("mistura: explica os dois casos", () => {
    expect(publishModeNotice(["instagram", "facebook"], true)).toMatch(
      /nas demais redes, a agência publica/,
    )
  })

  it("sem destinos, sem aviso", () => {
    expect(publishModeNotice([], true)).toBeNull()
  })
})

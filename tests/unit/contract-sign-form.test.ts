import { describe, expect, it } from "vitest"
import { canSign } from "@/lib/contracts/sign-form-state"

const base = {
  firstname: "Ana",
  email: "ana@acme.com",
  hasStroke: true,
  consent: true,
}

describe("canSign", () => {
  it("libera quando nome, e-mail, traço e consentimento existem", () => {
    expect(canSign(base)).toBe(true)
  })

  it("bloqueia sem nome", () => {
    expect(canSign({ ...base, firstname: "  " })).toBe(false)
  })

  it("bloqueia sem e-mail", () => {
    expect(canSign({ ...base, email: "" })).toBe(false)
  })

  it("bloqueia sem traço no quadro", () => {
    expect(canSign({ ...base, hasStroke: false })).toBe(false)
  })

  it("bloqueia sem consentimento", () => {
    expect(canSign({ ...base, consent: false })).toBe(false)
  })
})

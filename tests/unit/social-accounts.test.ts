import { describe, expect, it } from "vitest"
import {
  isAccountAllowedForCompany,
  validatePostTargets,
} from "@/lib/social-accounts"

const COMPANY_A = "00000000-0000-4000-8000-00000000000a"
const COMPANY_B = "00000000-0000-4000-8000-00000000000b"

describe("isAccountAllowedForCompany", () => {
  it("aceita conta do próprio cliente", () => {
    expect(
      isAccountAllowedForCompany({ company_id: COMPANY_A }, COMPANY_A),
    ).toBe(true)
  })

  it("aceita conta sem cliente (da agência)", () => {
    expect(isAccountAllowedForCompany({ company_id: null }, COMPANY_A)).toBe(
      true,
    )
  })

  it("recusa conta de outro cliente", () => {
    expect(
      isAccountAllowedForCompany({ company_id: COMPANY_B }, COMPANY_A),
    ).toBe(false)
  })
})

describe("validatePostTargets", () => {
  const accounts = [
    { id: "acc-a", company_id: COMPANY_A },
    { id: "acc-agency", company_id: null },
    { id: "acc-b", company_id: COMPANY_B },
  ]

  it("aceita contas do cliente e da agência", () => {
    expect(
      validatePostTargets(["acc-a", "acc-agency"], accounts, COMPANY_A),
    ).toEqual({ ok: true })
  })

  it("recusa quando alguma conta é de outro cliente", () => {
    expect(
      validatePostTargets(["acc-a", "acc-b"], accounts, COMPANY_A),
    ).toEqual({
      ok: false,
      reason: "other_company",
    })
  })

  it("recusa quando alguma conta não foi encontrada no tenant", () => {
    expect(
      validatePostTargets(["acc-a", "acc-inexistente"], accounts, COMPANY_A),
    ).toEqual({ ok: false, reason: "not_found" })
  })

  it("não conta IDs repetidos como contas diferentes", () => {
    expect(
      validatePostTargets(["acc-a", "acc-a"], [accounts[0]], COMPANY_A),
    ).toEqual({ ok: true })
  })
})

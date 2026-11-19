import { describe, expect, it } from "vitest"
import { resolveRequiresApproval } from "@/lib/social-approval"

describe("resolveRequiresApproval", () => {
  it("força aprovação quando a configuração exige", () => {
    expect(resolveRequiresApproval(true, false)).toBe(true)
    expect(resolveRequiresApproval(true, true)).toBe(true)
  })

  it("respeita a escolha do post quando a configuração não exige", () => {
    expect(resolveRequiresApproval(false, false)).toBe(false)
    expect(resolveRequiresApproval(false, true)).toBe(true)
  })
})

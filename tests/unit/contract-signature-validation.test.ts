import { describe, expect, it } from "vitest"
import { decodeSignatureDataUrl } from "@/lib/contracts/signature"
import { signContractSchema } from "@/lib/validations/contracts"

const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
const PNG = `data:image/png;base64,${Buffer.from(PNG_MAGIC).toString("base64")}`

describe("decodeSignatureDataUrl", () => {
  it("aceita PNG válido", () => {
    const out = decodeSignatureDataUrl(PNG)
    expect("bytes" in out && out.bytes.length).toBe(8)
  })

  it("recusa mime diferente de image/png", () => {
    expect(decodeSignatureDataUrl("data:image/jpeg;base64,AAAA")).toEqual({
      error: "Formato de assinatura inválido.",
    })
  })

  it("recusa string que não é data URL", () => {
    expect("error" in decodeSignatureDataUrl("abc")).toBe(true)
  })

  it("recusa base64 inválido", () => {
    expect(
      "error" in decodeSignatureDataUrl("data:image/png;base64,@@@"),
    ).toBe(true)
  })

  it("recusa bytes que não são PNG", () => {
    const notPng = `data:image/png;base64,${Buffer.from("abc").toString("base64")}`
    expect("error" in decodeSignatureDataUrl(notPng)).toBe(true)
  })

  it("recusa acima do limite", () => {
    expect("error" in decodeSignatureDataUrl(PNG, 4)).toBe(true)
  })
})

describe("signContractSchema", () => {
  const base = {
    firstname: "Ana",
    email: "ana@acme.com",
    signature: "data:image/png;base64,AAAA",
    consent: true as const,
  }

  it("aceita o payload mínimo", () => {
    expect(signContractSchema.safeParse(base).success).toBe(true)
  })

  it("exige consentimento explícito", () => {
    expect(
      signContractSchema.safeParse({ ...base, consent: false }).success,
    ).toBe(false)
  })

  it("exige e-mail válido", () => {
    expect(
      signContractSchema.safeParse({ ...base, email: "nao-e-email" }).success,
    ).toBe(false)
  })
})

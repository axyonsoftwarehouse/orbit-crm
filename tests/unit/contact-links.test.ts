import { describe, expect, it } from "vitest"
import {
  mailtoHref,
  telHref,
  whatsappHref,
  whatsappNumber,
} from "@/lib/contact-links"

describe("contact-links", () => {
  it("mailto só com e-mail válido", () => {
    expect(mailtoHref(" ana@padaria.test ")).toBe("mailto:ana@padaria.test")
    expect(mailtoHref("sem-arroba")).toBeNull()
    expect(mailtoHref(null)).toBeNull()
  })

  it("tel mantém o + e tira a máscara", () => {
    expect(telHref("(11) 98765-4321")).toBe("tel:11987654321")
    expect(telHref("+55 11 98765-4321")).toBe("tel:+5511987654321")
    expect(telHref("123")).toBeNull()
    expect(telHref("")).toBeNull()
  })

  it("WhatsApp: número brasileiro sem DDI recebe 55", () => {
    expect(whatsappNumber("(11) 98765-4321")).toBe("5511987654321")
    expect(whatsappNumber("11 3456-7890")).toBe("551134567890")
    expect(whatsappNumber("011 98765-4321")).toBe("5511987654321")
  })

  it("WhatsApp: número com DDI fica como está", () => {
    expect(whatsappNumber("+55 (21) 99999-0000")).toBe("5521999990000")
    expect(whatsappNumber("+1 415 555 0100")).toBe("14155550100")
    expect(whatsappNumber("5511987654321")).toBe("5511987654321")
  })

  it("WhatsApp: número curto demais não gera link", () => {
    expect(whatsappNumber("98765-4321")).toBeNull()
    expect(whatsappHref(null)).toBeNull()
    expect(whatsappHref("11987654321")).toBe("https://wa.me/5511987654321")
  })
})

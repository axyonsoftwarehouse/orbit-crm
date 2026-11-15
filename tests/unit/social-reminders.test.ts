import { describe, expect, it } from "vitest"
import { needsManualPublishReminder } from "@/server/social/reminders"

const active = (provider: string) => ({ provider, accountActive: true })
const inactive = (provider: string) => ({ provider, accountActive: false })

describe("needsManualPublishReminder", () => {
  it("lembra quando o post não tem destino", () => {
    expect(needsManualPublishReminder([], "provider")).toBe(true)
  })

  it("lembra sempre que o tenant está em modo manual", () => {
    expect(needsManualPublishReminder([active("instagram")], "manual")).toBe(
      true,
    )
  })

  it("não lembra quando todos os destinos são nativos e a conta está ativa", () => {
    expect(
      needsManualPublishReminder(
        [active("instagram"), active("linkedin")],
        "provider",
      ),
    ).toBe(false)
  })

  it("lembra quando há destino de rede sem integração nativa", () => {
    expect(
      needsManualPublishReminder(
        [active("instagram"), active("facebook")],
        "provider",
      ),
    ).toBe(true)
  })

  it("lembra quando o destino nativo está com a conta desconectada ou excluída", () => {
    expect(
      needsManualPublishReminder([inactive("instagram")], "provider"),
    ).toBe(true)
  })

  it("lembra quando o provedor é desconhecido", () => {
    expect(needsManualPublishReminder([active("")], "provider")).toBe(true)
  })
})

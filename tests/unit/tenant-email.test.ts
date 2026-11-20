import { describe, expect, it, vi } from "vitest"
import { createSupabaseMock } from "./supabase-mock"

vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn(async () => ({ sent: true })),
}))

import { sendEmail } from "@/lib/email"
import { sendTenantEmail } from "@/server/email"

describe("sendTenantEmail", () => {
  it("escapa as variáveis e transforma quebra de linha em <br>", async () => {
    const { client } = createSupabaseMock({
      email_templates: { data: null, error: null },
    })
    await sendTenantEmail(client as never, {
      tenantId: "t1",
      templateKey: "estimate_sent",
      to: "ana@cliente.test",
      vars: {
        tenant: "A&B",
        number: "EST-1",
        total: "R$ 1,00",
        date: "20/12/2026",
        link: "https://crm.test/d/x",
        message: "Linha 1\nLinha <2>",
      },
    })
    const html = vi.mocked(sendEmail).mock.calls[0][0].html
    expect(html).toContain("Linha 1<br>Linha &lt;2&gt;")
    expect(html).toContain("A&amp;B")
  })
})

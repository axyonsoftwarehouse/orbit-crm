import { describe, expect, it } from "vitest"
import { createSupabaseMock, hasCall } from "./supabase-mock"

const TENANT = "11111111-1111-4111-8111-111111111111"
const DOC = "22222222-2222-4222-8222-222222222222"
const ITEM_OK = "33333333-3333-4333-8333-333333333333"
const OLD_ID = "44444444-4444-4444-8444-444444444444"

import { replaceDocumentItems } from "@/server/documents"

function firstInsert(calls: { method: string; args: unknown[] }[][]) {
  return calls.flat().find((call) => call.method === "insert")?.args[0] as
    Record<string, unknown>[] | undefined
}

describe("replaceDocumentItems", () => {
  it("anula item_id de outro tenant e mantém o válido", async () => {
    const mock = createSupabaseMock({
      items: { data: [{ id: ITEM_OK }], error: null },
      document_items: (calls) =>
        calls.some((call) => call.method === "insert")
          ? { data: null, error: null }
          : { data: [{ id: OLD_ID }], error: null },
    })

    const result = await replaceDocumentItems(
      mock.client as never,
      TENANT,
      "estimate",
      DOC,
      [
        { description: "A", qty: 1, rate: 1, item_id: ITEM_OK },
        { description: "B", qty: 1, rate: 1, item_id: "item-de-outro-tenant" },
      ],
    )

    expect(result.error).toBeNull()
    const inserted = firstInsert(mock.callsFor("document_items"))
    expect(inserted?.map((row) => row.item_id)).toEqual([ITEM_OK, null])
    expect(
      mock.callsFor("document_items").some((calls) => hasCall(calls, "delete")),
    ).toBe(true)
  })

  it("se o insert falhar, não apaga as linhas antigas", async () => {
    const mock = createSupabaseMock({
      document_items: (calls) =>
        calls.some((call) => call.method === "insert")
          ? { data: null, error: { message: "boom" } }
          : { data: [{ id: OLD_ID }], error: null },
    })

    const result = await replaceDocumentItems(
      mock.client as never,
      TENANT,
      "invoice",
      DOC,
      [{ description: "A", qty: 1, rate: 1 }],
    )

    expect(result.error).toMatch(/Não foi possível/)
    expect(
      mock.callsFor("document_items").some((calls) => hasCall(calls, "delete")),
    ).toBe(false)
  })

  it("se a leitura das linhas antigas falhar, não grava nada", async () => {
    const mock = createSupabaseMock({
      document_items: { data: null, error: { message: "boom" } },
    })

    const result = await replaceDocumentItems(
      mock.client as never,
      TENANT,
      "estimate",
      DOC,
      [{ description: "A", qty: 1, rate: 1 }],
    )

    expect(result.error).toMatch(/Não foi possível/)
    expect(
      mock
        .callsFor("document_items")
        .some((calls) => calls.some((call) => call.method === "insert")),
    ).toBe(false)
  })

  it("devolve erro quando a limpeza das linhas antigas falha", async () => {
    const mock = createSupabaseMock({
      document_items: (calls) =>
        calls.some((call) => call.method === "insert")
          ? { data: null, error: null }
          : calls.some((call) => call.method === "delete")
            ? { data: null, error: { message: "boom" } }
            : { data: [{ id: OLD_ID }], error: null },
    })

    const result = await replaceDocumentItems(
      mock.client as never,
      TENANT,
      "estimate",
      DOC,
      [{ description: "A", qty: 1, rate: 1 }],
    )

    expect(result.error).toMatch(/linhas antigas/i)
  })
})

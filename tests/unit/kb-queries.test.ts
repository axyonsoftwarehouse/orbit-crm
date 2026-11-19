import { beforeEach, describe, expect, it, vi } from "vitest"
import { createSupabaseMock } from "./supabase-mock"

const TENANT = "11111111-1111-4111-8111-111111111111"
const ARTICLE = "33333333-3333-4333-8333-333333333333"

const state = vi.hoisted(() => ({ supabase: null as unknown }))

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => state.supabase,
}))

import { getKbArticle, recordKbArticleView } from "@/server/queries/kb"

describe("base de conhecimento", () => {
  let mock: ReturnType<typeof createSupabaseMock>

  beforeEach(() => {
    mock = createSupabaseMock({
      kb_articles: { data: { id: ARTICLE, views: 3 }, error: null },
    })
    state.supabase = mock.client
  })

  it("getKbArticle só lê, sem gravar visualização", async () => {
    const article = await getKbArticle(TENANT, ARTICLE)
    expect(article?.id).toBe(ARTICLE)
    for (const calls of mock.callsFor("kb_articles")) {
      expect(calls.some((call) => call.method === "update")).toBe(false)
    }
    expect(mock.client.rpc).not.toHaveBeenCalled()
  })

  it("recordKbArticleView incrementa pelo RPC atômico", async () => {
    await recordKbArticleView(ARTICLE)
    expect(mock.client.rpc).toHaveBeenCalledWith("increment_kb_article_views", {
      p_article: ARTICLE,
    })
  })
})

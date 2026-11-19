import { createClient } from "@/lib/supabase/server"

export type KbCategory = {
  id: string
  name: string
  description: string | null
  position: number
}

export type KbArticleRow = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  is_published: boolean
  views: number
  updated_at: string
  category: { id: string; name: string } | null
  author_name: string | null
}

export type KbArticle = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string | null
  is_published: boolean
  views: number
  category_id: string | null
  author_id: string | null
  created_at: string
  updated_at: string
}

export type Faq = {
  id: string
  question: string
  answer: string | null
  position: number
  is_published: boolean
}

export async function listKbCategories(
  tenantId: string,
): Promise<KbCategory[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("kb_categories")
    .select("id, name, description, position")
    .eq("tenant_id", tenantId)
    .order("position")
    .order("name")
  return (data ?? []) as KbCategory[]
}

export async function listKbArticles(
  tenantId: string,
  options: { categoryId?: string } = {},
): Promise<KbArticleRow[]> {
  const supabase = await createClient()
  let query = supabase
    .from("kb_articles")
    .select(
      "id, title, slug, excerpt, is_published, views, updated_at, category:kb_categories(id, name)",
    )
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })

  if (options.categoryId) query = query.eq("category_id", options.categoryId)

  const { data } = await query
  return (data ?? []) as unknown as KbArticleRow[]
}

export async function getKbArticle(
  tenantId: string,
  id: string,
): Promise<KbArticle | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("kb_articles")
    .select("*")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .maybeSingle()

  return (data as KbArticle | null) ?? null
}

/**
 * Conta uma visualização do artigo. Incremento atômico no banco (RPC
 * `increment_kb_article_views`, sujeito ao RLS), sem mexer em `updated_at`.
 * Chamado explicitamente pela página, fora da leitura.
 */
export async function recordKbArticleView(id: string): Promise<void> {
  const supabase = await createClient()
  await supabase.rpc("increment_kb_article_views", { p_article: id })
}

export async function listFaqs(tenantId: string): Promise<Faq[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("faqs")
    .select("id, question, answer, position, is_published")
    .eq("tenant_id", tenantId)
    .order("position")
    .order("created_at")
  return (data ?? []) as Faq[]
}

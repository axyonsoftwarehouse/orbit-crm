"use server"

import { dbError } from "@/lib/db-error"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth"
import { getActiveMembership } from "@/lib/tenant"
import { isManager } from "@/server/permissions"
import { slugify } from "@/lib/slug"
import {
  faqSchema,
  kbArticleSchema,
  kbCategorySchema,
} from "@/lib/validations/kb"

export type KbFormState = { error?: string; success?: string } | undefined

export async function createKbCategoryAction(
  _prevState: KbFormState,
  formData: FormData,
): Promise<KbFormState> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }

  const parsed = kbCategorySchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }

  const supabase = await createClient()
  const { error } = await supabase.from("kb_categories").insert({
    tenant_id: active.tenantId,
    name: parsed.data.name,
    description: parsed.data.description ?? null,
  })
  if (error) return dbError("kb", error)

  revalidatePath("/app/base-conhecimento")
  return { success: "Categoria criada." }
}

export async function deleteKbCategoryAction(formData: FormData) {
  const active = await getActiveMembership()
  if (!active) return
  if (!isManager(active.role)) return
  const id = String(formData.get("id") ?? "")
  const supabase = await createClient()
  await supabase
    .from("kb_categories")
    .delete()
    .eq("id", id)
    .eq("tenant_id", active.tenantId)
  revalidatePath("/app/base-conhecimento")
}

async function uniqueSlug(tenantId: string, title: string, ignoreId?: string) {
  const base = slugify(title) || "artigo"
  const supabase = await createClient()
  let slug = base
  for (let i = 2; i < 25; i++) {
    let query = supabase
      .from("kb_articles")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("slug", slug)
    if (ignoreId) query = query.neq("id", ignoreId)
    const { data } = await query.maybeSingle()
    if (!data) break
    slug = `${base}-${i}`
  }
  return slug
}

export async function createKbArticleAction(
  _prevState: KbFormState,
  formData: FormData,
): Promise<KbFormState> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }

  const parsed = kbArticleSchema.safeParse({
    title: formData.get("title"),
    category_id: formData.get("category_id") || undefined,
    excerpt: formData.get("excerpt") || undefined,
    content: formData.get("content") || undefined,
    is_published: formData.get("is_published") === "on",
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }

  const user = await getUser()
  const supabase = await createClient()
  const slug = await uniqueSlug(active.tenantId, parsed.data.title)

  const { data, error } = await supabase
    .from("kb_articles")
    .insert({
      tenant_id: active.tenantId,
      title: parsed.data.title,
      slug,
      category_id: parsed.data.category_id ?? null,
      excerpt: parsed.data.excerpt ?? null,
      content: parsed.data.content ?? null,
      is_published: parsed.data.is_published,
      author_id: user?.id ?? null,
    })
    .select("id")
    .single()
  if (error) return dbError("kb", error)

  revalidatePath("/app/base-conhecimento")
  redirect(`/app/base-conhecimento/${data.id}`)
}

export async function updateKbArticleAction(
  _prevState: KbFormState,
  formData: FormData,
): Promise<KbFormState> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }

  const id = String(formData.get("id") ?? "")
  if (!id) return { error: "Artigo inválido." }

  const parsed = kbArticleSchema.safeParse({
    title: formData.get("title"),
    category_id: formData.get("category_id") || undefined,
    excerpt: formData.get("excerpt") || undefined,
    content: formData.get("content") || undefined,
    is_published: formData.get("is_published") === "on",
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }

  const supabase = await createClient()
  const slug = await uniqueSlug(active.tenantId, parsed.data.title, id)

  const { error } = await supabase
    .from("kb_articles")
    .update({
      title: parsed.data.title,
      slug,
      category_id: parsed.data.category_id ?? null,
      excerpt: parsed.data.excerpt ?? null,
      content: parsed.data.content ?? null,
      is_published: parsed.data.is_published,
    })
    .eq("id", id)
    .eq("tenant_id", active.tenantId)
  if (error) return dbError("kb", error)

  revalidatePath("/app/base-conhecimento")
  revalidatePath(`/app/base-conhecimento/${id}`)
  return { success: "Artigo atualizado." }
}

export async function deleteKbArticleAction(formData: FormData) {
  const active = await getActiveMembership()
  if (!active) redirect("/app")
  if (!isManager(active.role)) redirect("/app")

  const id = String(formData.get("id") ?? "")
  const supabase = await createClient()
  await supabase
    .from("kb_articles")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("tenant_id", active.tenantId)

  revalidatePath("/app/base-conhecimento")
  redirect("/app/base-conhecimento")
}

export async function createFaqAction(
  _prevState: KbFormState,
  formData: FormData,
): Promise<KbFormState> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }

  const parsed = faqSchema.safeParse({
    question: formData.get("question"),
    answer: formData.get("answer") || undefined,
    is_published: formData.get("is_published") === "on",
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }

  const supabase = await createClient()
  const { error } = await supabase.from("faqs").insert({
    tenant_id: active.tenantId,
    question: parsed.data.question,
    answer: parsed.data.answer ?? null,
    is_published: parsed.data.is_published,
  })
  if (error) return dbError("kb", error)

  revalidatePath("/app/base-conhecimento")
  return { success: "FAQ adicionada." }
}

export async function deleteFaqAction(formData: FormData) {
  const active = await getActiveMembership()
  if (!active) return
  if (!isManager(active.role)) return
  const id = String(formData.get("id") ?? "")
  const supabase = await createClient()
  await supabase
    .from("faqs")
    .delete()
    .eq("id", id)
    .eq("tenant_id", active.tenantId)
  revalidatePath("/app/base-conhecimento")
}

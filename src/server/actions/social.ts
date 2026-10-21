"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth"
import { getActiveMembership } from "@/lib/tenant"
import { dbError } from "@/lib/db-error"
import type { Json } from "@/lib/database.types"
import { isManager } from "@/server/permissions"
import {
  socialAccountSchema,
  socialPostResponseSchema,
  socialPostSchema,
  socialScheduleSchema,
} from "@/lib/validations/social"
import { getPortalContact } from "@/server/queries/portal"

export type SocialFormState = { error?: string; success?: string } | undefined

async function recordEvent(
  tenantId: string,
  postId: string,
  event: string,
  actorId: string | null,
  metadata: Json = {},
) {
  const supabase = await createClient()
  await supabase.from("social_post_events").insert({
    tenant_id: tenantId,
    post_id: postId,
    event,
    actor_id: actorId,
    metadata,
  })
}

export async function createSocialAccountAction(
  _prevState: SocialFormState,
  formData: FormData,
): Promise<SocialFormState> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }
  if (!isManager(active.role)) {
    return { error: "Apenas owner/admin podem conectar contas." }
  }

  const parsed = socialAccountSchema.safeParse({
    provider: formData.get("provider"),
    provider_account_id: formData.get("provider_account_id"),
    display_name: formData.get("display_name"),
    company_id: formData.get("company_id") || undefined,
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }

  const user = await getUser()
  const supabase = await createClient()
  const { error } = await supabase.from("social_accounts").insert({
    tenant_id: active.tenantId,
    company_id: parsed.data.company_id ?? null,
    provider: parsed.data.provider,
    provider_account_id: parsed.data.provider_account_id,
    display_name: parsed.data.display_name,
    connected_by: user?.id ?? null,
  })

  if (error) return dbError("social_accounts", error)

  revalidatePath("/app/social/contas")
  return { success: "Conta adicionada." }
}

export async function deleteSocialAccountAction(formData: FormData) {
  const active = await getActiveMembership()
  if (!active) redirect("/app/social/contas")
  if (!isManager(active.role)) redirect("/app/social/contas")

  const id = String(formData.get("id") ?? "")
  if (!id) redirect("/app/social/contas")

  const supabase = await createClient()
  await supabase
    .from("social_accounts")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("tenant_id", active.tenantId)

  revalidatePath("/app/social/contas")
  redirect("/app/social/contas")
}

export async function createSocialPostAction(
  _prevState: SocialFormState,
  formData: FormData,
): Promise<SocialFormState> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }

  const parsed = socialPostSchema.safeParse({
    company_id: formData.get("company_id"),
    content: formData.get("content"),
    target_ids: formData.getAll("target_ids").map(String),
    requires_approval: formData.get("requires_approval") === "on",
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }

  const supabase = await createClient()
  const { data: accounts } = await supabase
    .from("social_accounts")
    .select("id, company_id")
    .eq("tenant_id", active.tenantId)
    .is("deleted_at", null)
    .in("id", parsed.data.target_ids)

  if ((accounts ?? []).length !== parsed.data.target_ids.length) {
    return { error: "Selecione contas válidas da empresa." }
  }

  const user = await getUser()
  const { data: post, error } = await supabase
    .from("social_posts")
    .insert({
      tenant_id: active.tenantId,
      company_id: parsed.data.company_id,
      content: parsed.data.content,
      requires_approval: parsed.data.requires_approval,
      status: parsed.data.requires_approval ? "draft" : "approved",
      created_by: user?.id ?? null,
    })
    .select("id")
    .single()

  if (error || !post) return dbError("social_posts", error)

  const { error: targetsError } = await supabase
    .from("social_post_targets")
    .insert(
      parsed.data.target_ids.map((accountId) => ({
        tenant_id: active.tenantId,
        post_id: post.id,
        account_id: accountId,
      })),
    )

  if (targetsError) return dbError("social_post_targets", targetsError)

  await recordEvent(active.tenantId, post.id, "created", user?.id ?? null)

  revalidatePath("/app/social")
  revalidatePath("/app/social/posts")
  return { success: "Post criado como rascunho." }
}

export async function submitSocialPostAction(formData: FormData) {
  const active = await getActiveMembership()
  if (!active) redirect("/app/social")

  const id = String(formData.get("id") ?? "")
  if (!id) redirect("/app/social")

  const supabase = await createClient()
  const { data: post } = await supabase
    .from("social_posts")
    .select("id, status")
    .eq("id", id)
    .eq("tenant_id", active.tenantId)
    .is("deleted_at", null)
    .maybeSingle()

  if (!post || !["draft", "rejected"].includes(post.status)) {
    redirect(`/app/social/${id}`)
  }

  const user = await getUser()
  await supabase
    .from("social_posts")
    .update({ status: "pending_approval", rejection_note: null })
    .eq("id", id)
    .eq("tenant_id", active.tenantId)

  await recordEvent(active.tenantId, id, "submitted", user?.id ?? null)
  revalidatePath("/app/social")
  revalidatePath(`/app/social/${id}`)
  redirect(`/app/social/${id}`)
}

export async function approveSocialPostAction(formData: FormData) {
  const active = await getActiveMembership()
  if (!active) redirect("/app/social")
  if (!isManager(active.role)) redirect("/app/social")

  const id = String(formData.get("id") ?? "")
  if (!id) redirect("/app/social")

  const user = await getUser()
  const supabase = await createClient()
  const { data: post } = await supabase
    .from("social_posts")
    .select("id, status")
    .eq("id", id)
    .eq("tenant_id", active.tenantId)
    .maybeSingle()

  if (!post || post.status !== "pending_approval") {
    redirect(`/app/social/${id}`)
  }

  await supabase
    .from("social_posts")
    .update({
      status: "approved",
      approved_by: user?.id ?? null,
      approved_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("tenant_id", active.tenantId)

  await recordEvent(active.tenantId, id, "approved", user?.id ?? null)
  revalidatePath("/app/social")
  revalidatePath(`/app/social/${id}`)
  redirect(`/app/social/${id}`)
}

export async function rejectSocialPostAction(formData: FormData) {
  const active = await getActiveMembership()
  if (!active) redirect("/app/social")
  if (!isManager(active.role)) redirect("/app/social")

  const id = String(formData.get("id") ?? "")
  const note = String(formData.get("note") ?? "").trim()
  if (!id) redirect("/app/social")

  const user = await getUser()
  const supabase = await createClient()
  await supabase
    .from("social_posts")
    .update({
      status: "rejected",
      rejected_by: user?.id ?? null,
      rejected_at: new Date().toISOString(),
      rejection_note: note || null,
    })
    .eq("id", id)
    .eq("tenant_id", active.tenantId)
    .eq("status", "pending_approval")

  await recordEvent(active.tenantId, id, "rejected", user?.id ?? null, {
    note,
  })
  revalidatePath("/app/social")
  revalidatePath(`/app/social/${id}`)
  redirect(`/app/social/${id}`)
}

export async function scheduleSocialPostAction(formData: FormData) {
  const active = await getActiveMembership()
  if (!active) redirect("/app/social")
  if (!isManager(active.role)) redirect("/app/social")

  const id = String(formData.get("id") ?? "")
  const parsed = socialScheduleSchema.safeParse({
    scheduled_at: formData.get("scheduled_at"),
  })
  if (!id || !parsed.success) redirect(`/app/social/${id}`)

  const scheduledAt = new Date(parsed.data.scheduled_at)
  if (Number.isNaN(scheduledAt.getTime())) redirect(`/app/social/${id}`)

  const user = await getUser()
  const supabase = await createClient()
  await supabase
    .from("social_posts")
    .update({
      status: "scheduled",
      scheduled_at: scheduledAt.toISOString(),
    })
    .eq("id", id)
    .eq("tenant_id", active.tenantId)
    .eq("status", "approved")

  await recordEvent(active.tenantId, id, "scheduled", user?.id ?? null, {
    scheduled_at: scheduledAt.toISOString(),
  })
  revalidatePath("/app/social")
  revalidatePath(`/app/social/${id}`)
  redirect(`/app/social/${id}`)
}

export async function cancelSocialPostAction(formData: FormData) {
  const active = await getActiveMembership()
  if (!active) redirect("/app/social")
  if (!isManager(active.role)) redirect("/app/social")

  const id = String(formData.get("id") ?? "")
  if (!id) redirect("/app/social")

  const user = await getUser()
  const supabase = await createClient()
  await supabase
    .from("social_posts")
    .update({ status: "cancelled", scheduled_at: null })
    .eq("id", id)
    .eq("tenant_id", active.tenantId)
    .in("status", ["draft", "pending_approval", "approved", "scheduled"])

  await recordEvent(active.tenantId, id, "cancelled", user?.id ?? null)
  revalidatePath("/app/social")
  revalidatePath(`/app/social/${id}`)
  redirect(`/app/social/${id}`)
}

export async function deleteSocialPostAction(formData: FormData) {
  const active = await getActiveMembership()
  if (!active) redirect("/app/social")
  if (!isManager(active.role)) redirect("/app/social")

  const id = String(formData.get("id") ?? "")
  if (!id) redirect("/app/social")

  const supabase = await createClient()
  await supabase
    .from("social_posts")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("tenant_id", active.tenantId)

  revalidatePath("/app/social")
  redirect("/app/social")
}

export async function respondPortalSocialPostAction(formData: FormData) {
  const contact = await getPortalContact()
  if (!contact) redirect("/portal/login")

  const parsed = socialPostResponseSchema.safeParse({
    post_id: formData.get("post_id"),
    approve: formData.get("approve") === "1",
    note: formData.get("note") || undefined,
  })
  if (!parsed.success) redirect("/portal/social")

  const supabase = await createClient()
  await supabase.rpc("portal_respond_social_post", {
    p_company: contact.company_id,
    p_post: parsed.data.post_id,
    p_approve: parsed.data.approve,
    p_note: parsed.data.note ?? undefined,
  })

  revalidatePath("/portal/social")
  revalidatePath(`/portal/social/${parsed.data.post_id}`)
  redirect("/portal/social")
}

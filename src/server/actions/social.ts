"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth"
import { getActiveMembership } from "@/lib/tenant"
import { dbError } from "@/lib/db-error"
import type { Json } from "@/lib/database.types"
import { socialNativeEnabled } from "@/lib/env"
import { zonedTimeToUtc } from "@/lib/timezone"
import { isManager } from "@/server/permissions"
import { checkPlanLimit } from "@/server/plan-limits"
import { verifyUploadedFile } from "@/server/storage-quota"
import { socialMediaFolder } from "@/lib/storage-paths"
import { getSocialSettings } from "@/server/queries/social"
import { clearSocialTokens } from "@/server/social/tokens"
import {
  notifyPortalApprovalRequested,
  notifyStaffPortalResponse,
} from "@/server/social/approval-notifications"
import {
  socialAccountSchema,
  socialPostResponseSchema,
  socialPostSchema,
  socialPostUpdateSchema,
  socialScheduleSchema,
} from "@/lib/validations/social"
import { getPortalContact } from "@/server/queries/portal"
import { validatePostTargets } from "@/lib/social-accounts"
import { resolveRequiresApproval } from "@/lib/social-approval"
import {
  APPROVAL_RESET_VALUES,
  editResetsApproval,
  isSocialPostEditable,
} from "@/lib/social-edit"

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

export async function updateSocialSettingsAction(
  _prevState: SocialFormState,
  formData: FormData,
): Promise<SocialFormState> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }
  if (!isManager(active.role)) {
    return { error: "Apenas owner/admin podem alterar as configurações." }
  }

  const supabase = await createClient()
  const { error } = await supabase.from("social_settings").upsert(
    {
      tenant_id: active.tenantId,
      approval_required: formData.get("approval_required") === "on",
    },
    { onConflict: "tenant_id" },
  )

  if (error) return dbError("social_settings", error)

  revalidatePath("/app/social")
  revalidatePath("/app/social/configuracoes")
  return { success: "Configurações salvas." }
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

  const limit = await checkPlanLimit(active.tenantId, "social_accounts")
  if (!limit.ok) return { error: limit.message ?? "Limite do plano atingido." }

  const provider = String(formData.get("provider") ?? "")
  if (
    socialNativeEnabled() &&
    (provider === "instagram" || provider === "linkedin")
  ) {
    return {
      error:
        "Use o botão Conectar conta para Instagram e LinkedIn; o cadastro manual é só para as demais redes.",
    }
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
  const { data: account } = await supabase
    .from("social_accounts")
    .select("id")
    .eq("id", id)
    .eq("tenant_id", active.tenantId)
    .is("deleted_at", null)
    .maybeSingle()

  if (!account) redirect("/app/social/contas")

  try {
    await clearSocialTokens(id)
  } catch {
    void 0
  }

  await supabase
    .from("social_accounts")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("tenant_id", active.tenantId)

  revalidatePath("/app/social/contas")
  redirect("/app/social/contas")
}

type ServerSupabase = Awaited<ReturnType<typeof createClient>>

/**
 * Confere se as contas pertencem ao tenant e ao cliente do post (ou à
 * agência). Devolve a lista sem repetição ou a mensagem de erro.
 */
async function resolvePostTargets(
  supabase: ServerSupabase,
  tenantId: string,
  requestedIds: string[],
  companyId: string,
): Promise<{ ids: string[] } | { error: string }> {
  const targetIds = [...new Set(requestedIds)]
  const { data: accounts, error } = await supabase
    .from("social_accounts")
    .select("id, company_id")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .in("id", targetIds)

  if (error) return dbError("social_accounts", error)

  const targets = validatePostTargets(targetIds, accounts ?? [], companyId)
  if (!targets.ok) {
    return {
      error:
        targets.reason === "other_company"
          ? "Selecione apenas contas deste cliente ou da agência."
          : "Selecione contas válidas da empresa.",
    }
  }
  return { ids: targetIds }
}

/**
 * Depois de mudar a mídia de um post aprovado/agendado que exige aprovação,
 * desfaz a aprovação (volta para rascunho), como na edição do texto.
 */
async function resetApprovalAfterMediaChange(
  supabase: ServerSupabase,
  tenantId: string,
  postId: string,
  actorId: string | null,
) {
  const { data: reset } = await supabase
    .from("social_posts")
    .update(APPROVAL_RESET_VALUES)
    .eq("id", postId)
    .eq("tenant_id", tenantId)
    .eq("requires_approval", true)
    .in("status", ["approved", "scheduled"])
    .select("id")

  if (reset?.length) {
    await recordEvent(tenantId, postId, "approval_reset", actorId, {
      reason: "media",
    })
    revalidatePath("/app/social")
  }
}

export async function createSocialPostAction(
  _prevState: SocialFormState,
  formData: FormData,
): Promise<SocialFormState> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }

  const limit = await checkPlanLimit(active.tenantId, "social_posts_month")
  if (!limit.ok) return { error: limit.message ?? "Limite do plano atingido." }

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
  const targets = await resolvePostTargets(
    supabase,
    active.tenantId,
    parsed.data.target_ids,
    parsed.data.company_id,
  )
  if ("error" in targets) return targets
  const targetIds = targets.ids

  const settings = await getSocialSettings(active.tenantId)
  const requiresApproval = resolveRequiresApproval(
    settings.approval_required,
    parsed.data.requires_approval,
  )

  const user = await getUser()
  const { data: post, error } = await supabase
    .from("social_posts")
    .insert({
      tenant_id: active.tenantId,
      company_id: parsed.data.company_id,
      content: parsed.data.content,
      requires_approval: requiresApproval,
      status: requiresApproval ? "draft" : "approved",
      created_by: user?.id ?? null,
    })
    .select("id")
    .single()

  if (error || !post) return dbError("social_posts", error)

  const { error: targetsError } = await supabase
    .from("social_post_targets")
    .insert(
      targetIds.map((accountId) => ({
        tenant_id: active.tenantId,
        post_id: post.id,
        account_id: accountId,
      })),
    )

  if (targetsError) return dbError("social_post_targets", targetsError)

  await recordEvent(active.tenantId, post.id, "created", user?.id ?? null)

  revalidatePath("/app/social")
  revalidatePath(`/app/social/${post.id}`)
  return {
    success: requiresApproval
      ? "Post criado como rascunho."
      : "Post aprovado e pronto para agendar.",
  }
}

export async function updateSocialPostAction(
  _prevState: SocialFormState,
  formData: FormData,
): Promise<SocialFormState> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }

  const parsed = socialPostUpdateSchema.safeParse({
    id: formData.get("id"),
    content: formData.get("content"),
    target_ids: formData.getAll("target_ids").map(String),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }
  const { id } = parsed.data

  const supabase = await createClient()
  const { data: post } = await supabase
    .from("social_posts")
    .select("id, status, company_id, requires_approval")
    .eq("id", id)
    .eq("tenant_id", active.tenantId)
    .is("deleted_at", null)
    .maybeSingle()

  if (!post) return { error: "Post não encontrado." }
  if (!isSocialPostEditable(post.status)) {
    return {
      error:
        post.status === "pending_approval"
          ? "O post está com o cliente para aprovação e não pode ser editado agora."
          : "Este post não pode mais ser editado.",
    }
  }
  if (!post.company_id) return { error: "Post sem cliente." }

  const targets = await resolvePostTargets(
    supabase,
    active.tenantId,
    parsed.data.target_ids,
    post.company_id,
  )
  if ("error" in targets) return targets

  const resetsApproval = editResetsApproval(post.status, post.requires_approval)
  const { data: updated, error: updateError } = await supabase
    .from("social_posts")
    .update({
      content: parsed.data.content,
      ...(resetsApproval ? APPROVAL_RESET_VALUES : {}),
    })
    .eq("id", id)
    .eq("tenant_id", active.tenantId)
    // Só grava se o status não mudou desde a leitura (ex.: cliente respondeu).
    .eq("status", post.status)
    .select("id")

  if (updateError) return dbError("social_posts", updateError)
  if (!updated?.length) {
    return { error: "O post mudou enquanto você editava. Recarregue a página." }
  }

  const { error: deleteError } = await supabase
    .from("social_post_targets")
    .delete()
    .eq("tenant_id", active.tenantId)
    .eq("post_id", id)
  if (deleteError) return dbError("social_post_targets", deleteError)

  const { error: targetsError } = await supabase
    .from("social_post_targets")
    .insert(
      targets.ids.map((accountId) => ({
        tenant_id: active.tenantId,
        post_id: id,
        account_id: accountId,
      })),
    )
  if (targetsError) return dbError("social_post_targets", targetsError)

  const user = await getUser()
  await recordEvent(active.tenantId, id, "edited", user?.id ?? null)
  if (resetsApproval) {
    await recordEvent(active.tenantId, id, "approval_reset", user?.id ?? null, {
      reason: "edit",
    })
  }

  revalidatePath("/app/social")
  revalidatePath(`/app/social/${id}`)
  return {
    success: resetsApproval
      ? "Post salvo. Ele voltou para rascunho: envie de novo para aprovação."
      : "Post salvo.",
  }
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
  const { data: updated } = await supabase
    .from("social_posts")
    .update({ status: "pending_approval", rejection_note: null })
    .eq("id", id)
    .eq("tenant_id", active.tenantId)
    .in("status", ["draft", "rejected"])
    .select("id")

  if (!updated?.length) redirect(`/app/social/${id}`)

  await recordEvent(active.tenantId, id, "submitted", user?.id ?? null)
  await notifyPortalApprovalRequested({ tenantId: active.tenantId, postId: id })
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

  const { data: updated } = await supabase
    .from("social_posts")
    .update({
      status: "approved",
      approved_by: user?.id ?? null,
      approved_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("tenant_id", active.tenantId)
    .eq("status", "pending_approval")
    .select("id")

  if (!updated?.length) redirect(`/app/social/${id}`)

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
  const { data: updated } = await supabase
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
    .select("id")

  if (!updated?.length) redirect(`/app/social/${id}`)

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

  const settings = await getSocialSettings(active.tenantId)
  const scheduledAt = zonedTimeToUtc(
    parsed.data.scheduled_at,
    settings.default_timezone,
  )
  if (!scheduledAt) redirect(`/app/social/${id}?error=schedule`)

  const supabase = await createClient()

  if (socialNativeEnabled()) {
    const { data: targets } = await supabase
      .from("social_post_targets")
      .select("account_id")
      .eq("post_id", id)
      .eq("tenant_id", active.tenantId)
    const accountIds = [
      ...new Set((targets ?? []).map((target) => target.account_id)),
    ]
    if (accountIds.length > 0) {
      const { data: accounts } = await supabase
        .from("social_accounts")
        .select("provider")
        .eq("tenant_id", active.tenantId)
        .in("id", accountIds)
      const hasInstagram = (accounts ?? []).some(
        (account) => account.provider === "instagram",
      )
      if (hasInstagram) {
        const { count } = await supabase
          .from("social_media")
          .select("id", { count: "exact", head: true })
          .eq("post_id", id)
          .eq("tenant_id", active.tenantId)
        if (!count) redirect(`/app/social/${id}?error=media`)
      }
    }
  }

  const user = await getUser()
  const { data: updated } = await supabase
    .from("social_posts")
    .update({
      status: "scheduled",
      scheduled_at: scheduledAt.toISOString(),
    })
    .eq("id", id)
    .eq("tenant_id", active.tenantId)
    .eq("status", "approved")
    .select("id")

  if (!updated?.length) redirect(`/app/social/${id}`)

  await recordEvent(active.tenantId, id, "scheduled", user?.id ?? null, {
    scheduled_at: scheduledAt.toISOString(),
  })
  revalidatePath("/app/social")
  revalidatePath(`/app/social/${id}`)
  redirect(`/app/social/${id}`)
}

export async function markSocialPostPublishedAction(formData: FormData) {
  const active = await getActiveMembership()
  if (!active) redirect("/app/social")
  if (!isManager(active.role)) redirect("/app/social")

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

  if (!post || !["approved", "scheduled"].includes(post.status)) {
    redirect(`/app/social/${id}`)
  }

  const user = await getUser()
  const now = new Date().toISOString()
  const { data: updated } = await supabase
    .from("social_posts")
    .update({
      status: "published",
      published_at: now,
      failure_reason: null,
    })
    .eq("id", id)
    .eq("tenant_id", active.tenantId)
    .in("status", ["approved", "scheduled"])
    .select("id")

  if (!updated?.length) redirect(`/app/social/${id}`)

  await supabase
    .from("social_post_targets")
    .update({
      status: "published",
      published_at: now,
      error: null,
      locked_at: null,
      next_attempt_at: null,
    })
    .eq("post_id", id)
    .eq("tenant_id", active.tenantId)
    .in("status", ["pending", "failed"])

  await recordEvent(active.tenantId, id, "published", user?.id ?? null, {
    mode: "manual",
  })

  revalidatePath("/app/social")
  revalidatePath(`/app/social/${id}`)
  redirect(`/app/social/${id}`)
}

export async function retrySocialPostAction(formData: FormData) {
  const active = await getActiveMembership()
  if (!active) redirect("/app/social")
  if (!isManager(active.role)) redirect("/app/social")

  const id = String(formData.get("id") ?? "")
  if (!id) redirect("/app/social")

  const supabase = await createClient()
  const { data: post } = await supabase
    .from("social_posts")
    .select("id, status, scheduled_at")
    .eq("id", id)
    .eq("tenant_id", active.tenantId)
    .is("deleted_at", null)
    .maybeSingle()

  if (
    !post ||
    !["failed", "partially_published", "scheduled", "publishing"].includes(
      post.status,
    )
  ) {
    redirect(`/app/social/${id}`)
  }

  const now = new Date().toISOString()
  const { data: targets } = await supabase
    .from("social_post_targets")
    .update({
      status: "pending",
      attempts: 0,
      error: null,
      locked_at: null,
      next_attempt_at: now,
    })
    .eq("post_id", id)
    .eq("tenant_id", active.tenantId)
    .in("status", ["failed", "publishing"])
    .select("id")

  if (!targets?.length) redirect(`/app/social/${id}`)

  await supabase
    .from("social_posts")
    .update({
      status: "scheduled",
      scheduled_at: post.scheduled_at ?? now,
      failure_reason: null,
    })
    .eq("id", id)
    .eq("tenant_id", active.tenantId)

  const user = await getUser()
  await recordEvent(active.tenantId, id, "retried", user?.id ?? null, {
    mode: "native",
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
  const { data: updated } = await supabase
    .from("social_posts")
    .update({ status: "cancelled", scheduled_at: null })
    .eq("id", id)
    .eq("tenant_id", active.tenantId)
    .in("status", ["draft", "pending_approval", "approved", "scheduled"])
    .select("id")

  if (!updated?.length) redirect(`/app/social/${id}`)

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

export async function registerSocialMediaAction(input: {
  postId: string
  storagePath: string
  fileName: string
  mimeType: string | null
  sizeBytes: number
}): Promise<{ error?: string }> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }
  if (
    !input.storagePath.startsWith(
      socialMediaFolder(active.tenantId, input.postId),
    )
  ) {
    return { error: "Caminho de arquivo inválido." }
  }

  const supabase = await createClient()
  const { data: post } = await supabase
    .from("social_posts")
    .select("id, status")
    .eq("id", input.postId)
    .eq("tenant_id", active.tenantId)
    .is("deleted_at", null)
    .maybeSingle()

  if (!post) return { error: "Post inválido." }
  if (!isSocialPostEditable(post.status)) {
    // O arquivo já subiu pela URL assinada; remove para não sobrar no bucket.
    await supabase.storage.from("social_media").remove([input.storagePath])
    return { error: "A mídia deste post não pode mais ser alterada." }
  }

  const verified = await verifyUploadedFile(supabase, {
    bucket: "social_media",
    table: "social_media",
    path: input.storagePath,
    tenantId: active.tenantId,
  })
  if ("error" in verified) return { error: verified.error }

  const user = await getUser()
  const { error } = await supabase.from("social_media").insert({
    tenant_id: active.tenantId,
    post_id: input.postId,
    storage_path: input.storagePath,
    file_name: input.fileName,
    mime_type: input.mimeType,
    size_bytes: verified.size,
    created_by: user?.id ?? null,
  })

  if (error) return dbError("social_media", error)

  await resetApprovalAfterMediaChange(
    supabase,
    active.tenantId,
    input.postId,
    user?.id ?? null,
  )
  revalidatePath(`/app/social/${input.postId}`)
  return {}
}

export async function deleteSocialMediaAction(formData: FormData) {
  const active = await getActiveMembership()
  if (!active) return

  const id = String(formData.get("id") ?? "")
  const postId = String(formData.get("post_id") ?? "")
  if (!id || !postId) return

  const supabase = await createClient()
  const user = await getUser()
  const { data: media } = await supabase
    .from("social_media")
    .select("storage_path, created_by, post_id")
    .eq("id", id)
    .eq("tenant_id", active.tenantId)
    .maybeSingle()

  if (!media || media.post_id !== postId) return
  if (!isManager(active.role) && media.created_by !== user?.id) return

  const { data: post } = await supabase
    .from("social_posts")
    .select("status")
    .eq("id", postId)
    .eq("tenant_id", active.tenantId)
    .maybeSingle()
  if (!post || !isSocialPostEditable(post.status)) return

  await supabase.storage.from("social_media").remove([media.storage_path])
  await supabase
    .from("social_media")
    .delete()
    .eq("id", id)
    .eq("tenant_id", active.tenantId)

  await resetApprovalAfterMediaChange(
    supabase,
    active.tenantId,
    postId,
    user?.id ?? null,
  )
  revalidatePath(`/app/social/${postId}`)
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
  const { data: responded } = await supabase.rpc("portal_respond_social_post", {
    p_company: contact.company_id,
    p_post: parsed.data.post_id,
    p_approve: parsed.data.approve,
    p_note: parsed.data.note ?? undefined,
  })

  if (responded === true) {
    await notifyStaffPortalResponse({
      postId: parsed.data.post_id,
      companyId: contact.company_id,
      approved: parsed.data.approve,
      note: parsed.data.note ?? null,
    })
  }

  revalidatePath("/portal/social")
  revalidatePath(`/portal/social/${parsed.data.post_id}`)
  redirect("/portal/social")
}

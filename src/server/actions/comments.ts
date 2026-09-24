"use server"

import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth"
import { getActiveMembership } from "@/lib/tenant"
import { revalidateEntity } from "@/lib/revalidate"

const ENTITY_TYPES = ["task", "project"]

export async function addCommentAction(formData: FormData) {
  const active = await getActiveMembership()
  if (!active) return

  const entityType = String(formData.get("entity_type") ?? "")
  const entityId = String(formData.get("entity_id") ?? "")
  const content = String(formData.get("content") ?? "").trim()

  if (!content || !entityId || !ENTITY_TYPES.includes(entityType)) return

  const user = await getUser()
  const supabase = await createClient()
  await supabase.from("comments").insert({
    tenant_id: active.tenantId,
    entity_type: entityType,
    entity_id: entityId,
    author_id: user?.id ?? null,
    content,
  })

  revalidateEntity(entityType, entityId)
}

export async function deleteCommentAction(formData: FormData) {
  const active = await getActiveMembership()
  if (!active) return

  const id = String(formData.get("id") ?? "")
  if (!id) return

  const supabase = await createClient()
  const { data: comment } = await supabase
    .from("comments")
    .select("author_id, entity_type, entity_id")
    .eq("id", id)
    .eq("tenant_id", active.tenantId)
    .maybeSingle()

  if (!comment) return

  const user = await getUser()
  const canModerate = active.role === "owner" || active.role === "admin"
  if (comment.author_id !== user?.id && !canModerate) return

  await supabase
    .from("comments")
    .delete()
    .eq("id", id)
    .eq("tenant_id", active.tenantId)

  revalidateEntity(comment.entity_type, comment.entity_id)
}

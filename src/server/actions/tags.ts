"use server"

import { dbError } from "@/lib/db-error"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getActiveMembership } from "@/lib/tenant"
import { tagSchema } from "@/lib/validations/tags"
import type { TaggedEntityType } from "@/server/queries/tags"

export type TagFormState = { error?: string; success?: string } | undefined

const ENTITY_PATHS: Record<TaggedEntityType, string> = {
  company: "/app/clientes",
  project: "/app/projetos",
  task: "/app/tarefas",
  lead: "/app/leads",
  ticket: "/app/tickets",
}

function isEntityType(value: string): value is TaggedEntityType {
  return value in ENTITY_PATHS
}

function revalidateEntity(type: TaggedEntityType, id: string) {
  const base = ENTITY_PATHS[type]
  revalidatePath(base)
  revalidatePath(`${base}/${id}`)
  if (type === "task") revalidatePath("/app/projetos")
}

function revalidateTagUsage() {
  for (const base of Object.values(ENTITY_PATHS)) revalidatePath(base)
  revalidatePath("/app/configuracoes")
}

function parseTag(formData: FormData) {
  return tagSchema.safeParse({
    name: formData.get("name"),
    color: formData.get("color") || undefined,
  })
}

export async function createTagAction(
  _prevState: TagFormState,
  formData: FormData,
): Promise<TagFormState> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }

  const parsed = parseTag(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("tags")
    .insert({ tenant_id: active.tenantId, ...parsed.data })

  if (error) {
    if (error.code === "23505")
      return { error: "Já existe uma tag com esse nome." }
    return dbError("tags", error)
  }

  revalidatePath("/app/configuracoes")
  return { success: "Tag criada." }
}

export async function updateTagAction(
  _prevState: TagFormState,
  formData: FormData,
): Promise<TagFormState> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }

  const id = String(formData.get("id") ?? "")
  if (!id) return { error: "Tag inválida." }

  const parsed = parseTag(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("tags")
    .update(parsed.data)
    .eq("id", id)
    .eq("tenant_id", active.tenantId)

  if (error) {
    if (error.code === "23505")
      return { error: "Já existe uma tag com esse nome." }
    return dbError("tags", error)
  }

  revalidateTagUsage()
  return { success: "Tag atualizada." }
}

export async function deleteTagAction(formData: FormData) {
  const active = await getActiveMembership()
  if (!active) return

  const id = String(formData.get("id") ?? "")
  if (!id) return

  const supabase = await createClient()
  await supabase
    .from("tags")
    .delete()
    .eq("id", id)
    .eq("tenant_id", active.tenantId)

  revalidateTagUsage()
}

export async function setEntityTagAction(input: {
  tagId: string
  entityType: string
  entityId: string
  assign: boolean
}) {
  const active = await getActiveMembership()
  if (!active) return
  if (!isEntityType(input.entityType) || !input.tagId || !input.entityId) return

  const supabase = await createClient()

  if (input.assign) {
    await supabase.from("taggables").upsert(
      {
        tenant_id: active.tenantId,
        tag_id: input.tagId,
        entity_type: input.entityType,
        entity_id: input.entityId,
      },
      { onConflict: "tag_id,entity_type,entity_id" },
    )
  } else {
    await supabase
      .from("taggables")
      .delete()
      .eq("tenant_id", active.tenantId)
      .eq("tag_id", input.tagId)
      .eq("entity_type", input.entityType)
      .eq("entity_id", input.entityId)
  }

  revalidateEntity(input.entityType, input.entityId)
}

export async function createTagForEntityAction(
  _prevState: TagFormState,
  formData: FormData,
): Promise<TagFormState> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }

  const entityType = String(formData.get("entity_type") ?? "")
  const entityId = String(formData.get("entity_id") ?? "")
  if (!isEntityType(entityType) || !entityId) {
    return { error: "Entidade inválida." }
  }

  const parsed = parseTag(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("tags")
    .insert({ tenant_id: active.tenantId, ...parsed.data })
    .select("id")
    .single()

  if (error) {
    if (error.code === "23505")
      return { error: "Já existe uma tag com esse nome." }
    return dbError("tags", error)
  }

  await supabase.from("taggables").insert({
    tenant_id: active.tenantId,
    tag_id: data.id,
    entity_type: entityType,
    entity_id: entityId,
  })

  revalidateEntity(entityType, entityId)
  return { success: "Tag criada." }
}

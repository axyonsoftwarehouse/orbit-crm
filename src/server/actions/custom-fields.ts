"use server"

import { dbError } from "@/lib/db-error"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getActiveMembership } from "@/lib/tenant"
import { customFieldDefinitionSchema } from "@/lib/validations/custom-fields"

export type CustomFieldFormState =
  { error?: string; success?: string } | undefined

function parseDefinition(formData: FormData) {
  const rawOptions = String(formData.get("options") ?? "")
  const options = rawOptions
    .split(/\r?\n|,/)
    .map((value) => value.trim())
    .filter(Boolean)

  return customFieldDefinitionSchema.safeParse({
    entity_type: formData.get("entity_type"),
    label: formData.get("label"),
    key: formData.get("key"),
    field_type: formData.get("field_type"),
    required: formData.get("required") === "on",
    position: formData.get("position") ?? 0,
    options,
  })
}

export async function createCustomFieldAction(
  _prevState: CustomFieldFormState,
  formData: FormData,
): Promise<CustomFieldFormState> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }

  const parsed = parseDefinition(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("custom_field_definitions")
    .insert({ tenant_id: active.tenantId, ...parsed.data })

  if (error) {
    if (error.code === "23505") {
      return { error: "Já existe um campo com essa chave nessa entidade." }
    }
    return dbError("custom-fields", error)
  }

  revalidatePath("/app/configuracoes")
  return { success: "Campo criado." }
}

export async function updateCustomFieldAction(
  _prevState: CustomFieldFormState,
  formData: FormData,
): Promise<CustomFieldFormState> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }

  const id = String(formData.get("id") ?? "")
  if (!id) return { error: "Campo inválido." }

  const parsed = parseDefinition(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("custom_field_definitions")
    .update(parsed.data)
    .eq("id", id)
    .eq("tenant_id", active.tenantId)

  if (error) {
    if (error.code === "23505") {
      return { error: "Já existe um campo com essa chave nessa entidade." }
    }
    return dbError("custom-fields", error)
  }

  revalidatePath("/app/configuracoes")
  return { success: "Campo atualizado." }
}

export async function deleteCustomFieldAction(formData: FormData) {
  const active = await getActiveMembership()
  if (!active) return

  const id = String(formData.get("id") ?? "")
  if (!id) return

  const supabase = await createClient()
  await supabase
    .from("custom_field_definitions")
    .delete()
    .eq("id", id)
    .eq("tenant_id", active.tenantId)

  revalidatePath("/app/configuracoes")
}

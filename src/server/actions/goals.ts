"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth"
import { getActiveMembership } from "@/lib/tenant"
import { goalSchema } from "@/lib/validations/goals"

export type GoalFormState = { error?: string; success?: string } | undefined

function parseGoal(formData: FormData) {
  return goalSchema.safeParse({
    title: formData.get("title") || undefined,
    metric: formData.get("metric"),
    period_start: formData.get("period_start"),
    period_end: formData.get("period_end"),
    target: formData.get("target"),
  })
}

export async function createGoalAction(
  _prevState: GoalFormState,
  formData: FormData,
): Promise<GoalFormState> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }

  const parsed = parseGoal(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }

  const user = await getUser()
  const supabase = await createClient()
  const { error } = await supabase.from("goals").insert({
    tenant_id: active.tenantId,
    created_by: user?.id ?? null,
    ...parsed.data,
  })

  if (error) return { error: error.message }

  revalidatePath("/app/metas")
  return { success: "Meta criada." }
}

export async function updateGoalAction(
  _prevState: GoalFormState,
  formData: FormData,
): Promise<GoalFormState> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }

  const id = String(formData.get("id") ?? "")
  if (!id) return { error: "Meta inválida." }

  const parsed = parseGoal(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("goals")
    .update(parsed.data)
    .eq("id", id)
    .eq("tenant_id", active.tenantId)

  if (error) return { error: error.message }

  revalidatePath("/app/metas")
  return { success: "Meta atualizada." }
}

export async function deleteGoalAction(formData: FormData) {
  const active = await getActiveMembership()
  if (!active) redirect("/app")

  const id = String(formData.get("id") ?? "")
  const supabase = await createClient()
  await supabase
    .from("goals")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("tenant_id", active.tenantId)

  revalidatePath("/app/metas")
}

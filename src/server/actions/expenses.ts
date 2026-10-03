"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth"
import { getActiveMembership } from "@/lib/tenant"
import { expenseSchema } from "@/lib/validations/expenses"

export type ExpenseFormState = { error?: string; success?: string } | undefined

function parseExpense(formData: FormData) {
  return expenseSchema.safeParse({
    title: formData.get("title"),
    category: formData.get("category") || undefined,
    amount: formData.get("amount"),
    date: formData.get("date"),
    project_id: formData.get("project_id") || undefined,
    company_id: formData.get("company_id") || undefined,
    billable: formData.get("billable") === "on",
    note: formData.get("note") || undefined,
  })
}

export async function createExpenseAction(
  _prevState: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }

  const parsed = parseExpense(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }

  const user = await getUser()
  const supabase = await createClient()
  const { error } = await supabase.from("expenses").insert({
    tenant_id: active.tenantId,
    created_by: user?.id ?? null,
    ...parsed.data,
  })

  if (error) return { error: error.message }

  revalidatePath("/app/despesas")
  return { success: "Despesa criada." }
}

export async function updateExpenseAction(
  _prevState: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }

  const id = String(formData.get("id") ?? "")
  if (!id) return { error: "Despesa inválida." }

  const parsed = parseExpense(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("expenses")
    .update(parsed.data)
    .eq("id", id)
    .eq("tenant_id", active.tenantId)

  if (error) return { error: error.message }

  revalidatePath("/app/despesas")
  return { success: "Despesa atualizada." }
}

export async function deleteExpenseAction(formData: FormData) {
  const active = await getActiveMembership()
  if (!active) redirect("/app")

  const id = String(formData.get("id") ?? "")
  const supabase = await createClient()
  await supabase
    .from("expenses")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("tenant_id", active.tenantId)

  revalidatePath("/app/despesas")
}

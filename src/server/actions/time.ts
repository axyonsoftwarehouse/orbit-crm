"use server"

import { dbError } from "@/lib/db-error"

import { revalidatePath } from "next/cache"
import type { SupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth"
import { getActiveMembership } from "@/lib/tenant"
import { manualEntrySchema } from "@/lib/validations/time"

export type ManualEntryState = { error?: string; success?: string } | undefined

async function resolveRate(
  supabase: SupabaseClient,
  tenantId: string,
  projectId: string,
  taskId: string | null,
  override: number | null | undefined,
): Promise<number | null> {
  if (override !== null && override !== undefined) return override

  const { data: project } = await supabase
    .from("projects")
    .select("billing_type, rate_per_hour")
    .eq("id", projectId)
    .eq("tenant_id", tenantId)
    .maybeSingle()

  if (project?.billing_type === 2) {
    return project.rate_per_hour ?? null
  }
  if (project?.billing_type === 3 && taskId) {
    const { data: task } = await supabase
      .from("tasks")
      .select("hourly_rate")
      .eq("id", taskId)
      .eq("tenant_id", tenantId)
      .maybeSingle()
    return task?.hourly_rate ?? null
  }
  return null
}

export async function startTimerAction(formData: FormData) {
  const active = await getActiveMembership()
  if (!active) return
  const user = await getUser()
  if (!user) return

  const projectId = String(formData.get("project_id") ?? "")
  if (!projectId) return
  const taskId = String(formData.get("task_id") ?? "") || null
  const note = String(formData.get("note") ?? "").trim() || null
  const isBillable = formData.get("is_billable") === "on"

  const supabase = await createClient()

  const { data: running } = await supabase
    .from("time_entries")
    .select("id, started_at")
    .eq("tenant_id", active.tenantId)
    .eq("user_id", user.id)
    .is("ended_at", null)
    .maybeSingle()

  if (running) {
    const seconds = Math.max(
      0,
      Math.round((Date.now() - new Date(running.started_at).getTime()) / 1000),
    )
    await supabase
      .from("time_entries")
      .update({ ended_at: new Date().toISOString(), duration_seconds: seconds })
      .eq("id", running.id)
  }

  const rate = await resolveRate(
    supabase,
    active.tenantId,
    projectId,
    taskId,
    null,
  )

  await supabase.from("time_entries").insert({
    tenant_id: active.tenantId,
    project_id: projectId,
    task_id: taskId,
    user_id: user.id,
    started_at: new Date().toISOString(),
    ended_at: null,
    duration_seconds: null,
    is_billable: isBillable,
    rate,
    note,
  })

  revalidatePath("/app/timesheet")
}

export async function stopTimerAction(formData: FormData) {
  const active = await getActiveMembership()
  if (!active) return
  const user = await getUser()
  if (!user) return

  const id = String(formData.get("id") ?? "")
  if (!id) return

  const supabase = await createClient()
  const { data: entry } = await supabase
    .from("time_entries")
    .select("id, started_at")
    .eq("id", id)
    .eq("tenant_id", active.tenantId)
    .eq("user_id", user.id)
    .is("ended_at", null)
    .maybeSingle()

  if (!entry) return

  const seconds = Math.max(
    1,
    Math.round((Date.now() - new Date(entry.started_at).getTime()) / 1000),
  )
  await supabase
    .from("time_entries")
    .update({ ended_at: new Date().toISOString(), duration_seconds: seconds })
    .eq("id", id)

  revalidatePath("/app/timesheet")
}

export async function addManualEntryAction(
  _prevState: ManualEntryState,
  formData: FormData,
): Promise<ManualEntryState> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }
  const user = await getUser()
  if (!user) return { error: "Sessão inválida." }

  const parsed = manualEntrySchema.safeParse({
    project_id: formData.get("project_id") || undefined,
    task_id: formData.get("task_id") || undefined,
    date: formData.get("date"),
    hours: formData.get("hours"),
    note: formData.get("note") || undefined,
    is_billable: formData.get("is_billable") === "on",
    rate: formData.get("rate"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }

  const startedAt = new Date(`${parsed.data.date}T09:00:00`)
  const seconds = Math.round(parsed.data.hours * 3600)
  const endedAt = new Date(startedAt.getTime() + seconds * 1000)

  const supabase = await createClient()
  const rate = await resolveRate(
    supabase,
    active.tenantId,
    parsed.data.project_id,
    parsed.data.task_id ?? null,
    parsed.data.rate ?? null,
  )

  const { error } = await supabase.from("time_entries").insert({
    tenant_id: active.tenantId,
    project_id: parsed.data.project_id,
    task_id: parsed.data.task_id ?? null,
    user_id: user.id,
    started_at: startedAt.toISOString(),
    ended_at: endedAt.toISOString(),
    duration_seconds: seconds,
    is_billable: parsed.data.is_billable,
    rate,
    note: parsed.data.note ?? null,
  })

  if (error) return dbError("time", error)

  revalidatePath("/app/timesheet")
  return { success: "Lançamento adicionado." }
}

export async function deleteTimeEntryAction(formData: FormData) {
  const active = await getActiveMembership()
  if (!active) return

  const id = String(formData.get("id") ?? "")
  if (!id) return

  const supabase = await createClient()
  await supabase
    .from("time_entries")
    .delete()
    .eq("id", id)
    .eq("tenant_id", active.tenantId)

  revalidatePath("/app/timesheet")
}

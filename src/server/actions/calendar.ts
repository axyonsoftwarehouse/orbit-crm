"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth"
import { getActiveMembership } from "@/lib/tenant"
import { calendarEventSchema } from "@/lib/validations/calendar"

export type CalendarFormState = { error?: string; success?: string } | undefined

function toIso(value: string | null | undefined): string | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function parseEvent(formData: FormData) {
  return calendarEventSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    start_at: formData.get("start_at"),
    end_at: formData.get("end_at") || "",
    company_id: formData.get("company_id") || undefined,
    project_id: formData.get("project_id") || undefined,
  })
}

export async function createCalendarEventAction(
  _prevState: CalendarFormState,
  formData: FormData,
): Promise<CalendarFormState> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }

  const parsed = parseEvent(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }

  const startAt = toIso(parsed.data.start_at)
  if (!startAt) return { error: "Data de início inválida." }

  const user = await getUser()
  const supabase = await createClient()
  const { error } = await supabase.from("calendar_events").insert({
    tenant_id: active.tenantId,
    created_by: user?.id ?? null,
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    start_at: startAt,
    end_at: toIso(parsed.data.end_at),
    company_id: parsed.data.company_id ?? null,
    project_id: parsed.data.project_id ?? null,
  })

  if (error) return { error: error.message }

  revalidatePath("/app/calendario")
  return { success: "Evento criado." }
}

export async function updateCalendarEventAction(
  _prevState: CalendarFormState,
  formData: FormData,
): Promise<CalendarFormState> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }

  const id = String(formData.get("id") ?? "")
  if (!id) return { error: "Evento inválido." }

  const parsed = parseEvent(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }

  const startAt = toIso(parsed.data.start_at)
  if (!startAt) return { error: "Data de início inválida." }

  const supabase = await createClient()
  const { error } = await supabase
    .from("calendar_events")
    .update({
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      start_at: startAt,
      end_at: toIso(parsed.data.end_at),
      company_id: parsed.data.company_id ?? null,
      project_id: parsed.data.project_id ?? null,
    })
    .eq("id", id)
    .eq("tenant_id", active.tenantId)

  if (error) return { error: error.message }

  revalidatePath("/app/calendario")
  return { success: "Evento atualizado." }
}

export async function deleteCalendarEventAction(formData: FormData) {
  const active = await getActiveMembership()
  if (!active) redirect("/app")

  const id = String(formData.get("id") ?? "")
  const supabase = await createClient()
  await supabase
    .from("calendar_events")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("tenant_id", active.tenantId)

  revalidatePath("/app/calendario")
}

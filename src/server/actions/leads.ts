"use server"

import { dbError } from "@/lib/db-error"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth"
import { getActiveMembership } from "@/lib/tenant"
import {
  leadActivitySchema,
  leadSchema,
  leadSourceSchema,
  leadStatusSchema,
} from "@/lib/validations/leads"
import { getLead, listLeadStatuses } from "@/server/queries/leads"
import { saveCustomFieldValues } from "@/server/custom-fields"
import { checkPlanLimit } from "@/server/plan-limits"

export type LeadFormState = { error?: string; success?: string } | undefined

function parseLead(formData: FormData) {
  return leadSchema.safeParse({
    name: formData.get("name"),
    company: formData.get("company") || undefined,
    title: formData.get("title") || undefined,
    email: formData.get("email") || "",
    phone: formData.get("phone") || undefined,
    website: formData.get("website") || undefined,
    description: formData.get("description") || undefined,
    status_id: formData.get("status_id") || undefined,
    source_id: formData.get("source_id") || undefined,
    value: formData.get("value"),
    assignee_id: formData.get("assignee_id") || undefined,
    city: formData.get("city") || undefined,
    state: formData.get("state") || undefined,
    country: formData.get("country") || undefined,
  })
}

export async function createLeadAction(
  _prevState: LeadFormState,
  formData: FormData,
): Promise<LeadFormState> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }

  const limit = await checkPlanLimit(active.tenantId, "leads")
  if (!limit.ok) return { error: limit.message ?? "Limite do plano atingido." }

  const parsed = parseLead(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }

  const user = await getUser()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("leads")
    .insert({
      tenant_id: active.tenantId,
      created_by: user?.id ?? null,
      ...parsed.data,
      value: parsed.data.value ?? null,
    })
    .select("id")
    .single()
  if (error) return dbError("leads", error)

  await saveCustomFieldValues(
    supabase,
    active.tenantId,
    "lead",
    data.id,
    formData,
  )

  revalidatePath("/app/leads")
  return { success: "Lead criado." }
}

export async function updateLeadAction(
  _prevState: LeadFormState,
  formData: FormData,
): Promise<LeadFormState> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }

  const id = String(formData.get("id") ?? "")
  if (!id) return { error: "Lead inválido." }

  const parsed = parseLead(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("leads")
    .update({ ...parsed.data, value: parsed.data.value ?? null })
    .eq("id", id)
    .eq("tenant_id", active.tenantId)
  if (error) return dbError("leads", error)

  await saveCustomFieldValues(supabase, active.tenantId, "lead", id, formData)

  revalidatePath("/app/leads")
  revalidatePath(`/app/leads/${id}`)
  return { success: "Lead atualizado." }
}

export async function updateLeadStatusAction(formData: FormData) {
  const active = await getActiveMembership()
  if (!active) return

  const id = String(formData.get("id") ?? "")
  const statusId = String(formData.get("status_id") ?? "") || null
  if (!id) return

  const supabase = await createClient()
  await supabase
    .from("leads")
    .update({ status_id: statusId })
    .eq("id", id)
    .eq("tenant_id", active.tenantId)

  revalidatePath("/app/leads")
  revalidatePath(`/app/leads/${id}`)
}

export async function setLeadStatusAction(input: {
  id: string
  statusId: string | null
}) {
  const active = await getActiveMembership()
  if (!active || !input.id) return

  const supabase = await createClient()
  await supabase
    .from("leads")
    .update({ status_id: input.statusId })
    .eq("id", input.id)
    .eq("tenant_id", active.tenantId)

  revalidatePath("/app/leads")
  revalidatePath(`/app/leads/${input.id}`)
}

export async function deleteLeadAction(formData: FormData) {
  const active = await getActiveMembership()
  if (!active) redirect("/app")

  const id = String(formData.get("id") ?? "")
  const supabase = await createClient()
  await supabase
    .from("leads")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("tenant_id", active.tenantId)

  revalidatePath("/app/leads")
  redirect("/app/leads")
}

export async function addLeadActivityAction(formData: FormData) {
  const active = await getActiveMembership()
  if (!active) return

  const leadId = String(formData.get("lead_id") ?? "")
  const parsed = leadActivitySchema.safeParse({
    description: formData.get("description"),
  })
  if (!leadId || !parsed.success) return

  const user = await getUser()
  const supabase = await createClient()
  await supabase.from("lead_activities").insert({
    tenant_id: active.tenantId,
    lead_id: leadId,
    author_id: user?.id ?? null,
    description: parsed.data.description,
  })

  revalidatePath(`/app/leads/${leadId}`)
}

export async function convertLeadToCustomerAction(formData: FormData) {
  const active = await getActiveMembership()
  if (!active) redirect("/app")

  const id = String(formData.get("id") ?? "")
  const lead = await getLead(active.tenantId, id)
  if (!lead) return
  if (lead.converted_company_id) {
    redirect(`/app/clientes/${lead.converted_company_id}`)
  }

  const user = await getUser()
  const supabase = await createClient()

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .insert({
      tenant_id: active.tenantId,
      name: lead.company || lead.name,
      phone: lead.phone,
      website: lead.website,
      city: lead.city,
      state: lead.state,
      country: lead.country,
      created_by: user?.id ?? null,
    })
    .select("id")
    .single()
  if (companyError || !company) return

  const parts = lead.name.trim().split(/\s+/)
  await supabase.from("contacts").insert({
    tenant_id: active.tenantId,
    company_id: company.id,
    first_name: parts[0] ?? lead.name,
    last_name: parts.slice(1).join(" ") || null,
    email: lead.email,
    phone: lead.phone,
    title: lead.title,
    is_primary: true,
    created_by: user?.id ?? null,
  })

  const statuses = await listLeadStatuses(active.tenantId)
  const wonStatus = statuses.find((s) => s.is_won)

  await supabase
    .from("leads")
    .update({
      converted_company_id: company.id,
      converted_at: new Date().toISOString(),
      lost: false,
      status_id: wonStatus?.id ?? lead.status_id,
    })
    .eq("id", id)
    .eq("tenant_id", active.tenantId)

  await supabase.from("lead_activities").insert({
    tenant_id: active.tenantId,
    lead_id: id,
    author_id: user?.id ?? null,
    description: `Lead convertido no cliente "${lead.company || lead.name}"`,
  })

  revalidatePath("/app/leads")
  redirect(`/app/clientes/${company.id}`)
}

export async function createLeadStatusAction(
  _prevState: LeadFormState,
  formData: FormData,
): Promise<LeadFormState> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }

  const parsed = leadStatusSchema.safeParse({
    name: formData.get("name"),
    color: formData.get("color") || undefined,
    is_won: formData.get("is_won") === "on",
    is_lost: formData.get("is_lost") === "on",
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }

  const supabase = await createClient()
  const { count } = await supabase
    .from("lead_statuses")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", active.tenantId)

  const { error } = await supabase.from("lead_statuses").insert({
    tenant_id: active.tenantId,
    name: parsed.data.name,
    color: parsed.data.color ?? "#92929d",
    position: count ?? 0,
    is_won: parsed.data.is_won,
    is_lost: parsed.data.is_lost,
  })
  if (error) return dbError("leads", error)

  revalidatePath("/app/leads")
  return { success: "Status criado." }
}

export async function deleteLeadStatusAction(formData: FormData) {
  const active = await getActiveMembership()
  if (!active) return
  const id = String(formData.get("id") ?? "")
  const supabase = await createClient()
  await supabase
    .from("lead_statuses")
    .delete()
    .eq("id", id)
    .eq("tenant_id", active.tenantId)
  revalidatePath("/app/leads")
}

export async function createLeadSourceAction(
  _prevState: LeadFormState,
  formData: FormData,
): Promise<LeadFormState> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }

  const parsed = leadSourceSchema.safeParse({ name: formData.get("name") })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }

  const supabase = await createClient()
  const { error } = await supabase.from("lead_sources").insert({
    tenant_id: active.tenantId,
    name: parsed.data.name,
  })
  if (error) return dbError("leads", error)

  revalidatePath("/app/leads")
  return { success: "Origem criada." }
}

export async function deleteLeadSourceAction(formData: FormData) {
  const active = await getActiveMembership()
  if (!active) return
  const id = String(formData.get("id") ?? "")
  const supabase = await createClient()
  await supabase
    .from("lead_sources")
    .delete()
    .eq("id", id)
    .eq("tenant_id", active.tenantId)
  revalidatePath("/app/leads")
}

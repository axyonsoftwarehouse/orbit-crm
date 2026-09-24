"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getProfile, getUser } from "@/lib/auth"
import {
  DEFAULT_DEPARTMENTS,
  DEFAULT_LEAD_SOURCES,
  DEFAULT_LEAD_STATUSES,
} from "@/lib/leads-defaults"
import { createTenantSchema } from "@/lib/validations/auth"
import { planSchema } from "@/lib/validations/plan"

export type CreateTenantState = { error?: string; success?: string } | undefined

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

export async function createTenantAction(
  _prevState: CreateTenantState,
  formData: FormData,
): Promise<CreateTenantState> {
  const profile = await getProfile()
  if (!profile?.is_super_admin) {
    return { error: "Apenas super-admins podem criar empresas." }
  }

  const parsed = createTenantSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug") || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }

  const slug = parsed.data.slug ?? slugify(parsed.data.name)
  const supabase = await createClient()

  const { data: tenant, error } = await supabase
    .from("tenants")
    .insert({ name: parsed.data.name, slug })
    .select("id")
    .single()

  if (error || !tenant) {
    return { error: error?.message ?? "Não foi possível criar a empresa." }
  }

  const user = await getUser()
  if (user) {
    const { error: memberError } = await supabase.from("memberships").insert({
      tenant_id: tenant.id,
      user_id: user.id,
      role: "owner",
      status: "active",
    })

    if (memberError) {
      return {
        error: `Empresa criada, mas falhou incluir você como proprietário: ${memberError.message}`,
      }
    }
  }

  await supabase.from("lead_statuses").insert(
    DEFAULT_LEAD_STATUSES.map((status) => ({
      tenant_id: tenant.id,
      name: status.name,
      color: status.color,
      position: status.position,
      is_default: status.is_default,
      is_won: status.is_won,
      is_lost: status.is_lost,
    })),
  )
  await supabase.from("lead_sources").insert(
    DEFAULT_LEAD_SOURCES.map((name) => ({
      tenant_id: tenant.id,
      name,
    })),
  )
  await supabase
    .from("departments")
    .insert(DEFAULT_DEPARTMENTS.map((name) => ({ tenant_id: tenant.id, name })))

  revalidatePath("/plataforma")
  return { success: `Empresa "${parsed.data.name}" criada.` }
}

export type PlanFormState = { error?: string; success?: string } | undefined

function parsePlan(formData: FormData) {
  return planSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    price: formData.get("price") ?? 0,
    interval: formData.get("interval") || "monthly",
    trial_days: formData.get("trial_days") ?? 0,
    most_popular: formData.get("most_popular") === "on",
    limits: {
      clients: formData.get("limits_clients"),
      projects: formData.get("limits_projects"),
      tasks: formData.get("limits_tasks"),
      tickets: formData.get("limits_tickets"),
      leads: formData.get("limits_leads"),
    },
  })
}

async function requireSuperAdminOrError() {
  const profile = await getProfile()
  return profile?.is_super_admin ?? false
}

export async function createPlanAction(
  _prevState: PlanFormState,
  formData: FormData,
): Promise<PlanFormState> {
  if (!(await requireSuperAdminOrError())) {
    return { error: "Apenas super-admins podem gerenciar planos." }
  }

  const parsed = parsePlan(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }

  const supabase = await createClient()
  const { error } = await supabase.from("plans").insert({
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    price: parsed.data.price,
    interval: parsed.data.interval,
    trial_days: parsed.data.trial_days,
    most_popular: parsed.data.most_popular,
    limits: parsed.data.limits,
  })
  if (error) return { error: error.message }

  revalidatePath("/plataforma")
  return { success: "Plano criado." }
}

export async function updatePlanAction(
  _prevState: PlanFormState,
  formData: FormData,
): Promise<PlanFormState> {
  if (!(await requireSuperAdminOrError())) {
    return { error: "Apenas super-admins podem gerenciar planos." }
  }

  const id = String(formData.get("id") ?? "")
  if (!id) return { error: "Plano inválido." }

  const parsed = parsePlan(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("plans")
    .update({
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      price: parsed.data.price,
      interval: parsed.data.interval,
      trial_days: parsed.data.trial_days,
      most_popular: parsed.data.most_popular,
      limits: parsed.data.limits,
    })
    .eq("id", id)
  if (error) return { error: error.message }

  revalidatePath("/plataforma")
  return { success: "Plano atualizado." }
}

export async function deletePlanAction(formData: FormData) {
  if (!(await requireSuperAdminOrError())) return
  const id = String(formData.get("id") ?? "")
  const supabase = await createClient()
  await supabase.from("plans").delete().eq("id", id)
  revalidatePath("/plataforma")
}

export async function setTenantPlanAction(formData: FormData) {
  if (!(await requireSuperAdminOrError())) return

  const tenantId = String(formData.get("tenant_id") ?? "")
  const planId = String(formData.get("plan_id") ?? "") || null
  if (!tenantId) return

  const supabase = await createClient()
  await supabase.from("tenants").update({ plan_id: planId }).eq("id", tenantId)
  revalidatePath("/plataforma")
}

export async function deleteTenantAction(formData: FormData) {
  if (!(await requireSuperAdminOrError())) return
  const id = String(formData.get("id") ?? "")
  const supabase = await createClient()
  await supabase.from("tenants").delete().eq("id", id)
  revalidatePath("/plataforma")
}

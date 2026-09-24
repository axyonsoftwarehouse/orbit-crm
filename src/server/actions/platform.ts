"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getProfile, getUser } from "@/lib/auth"
import { createTenantSchema } from "@/lib/validations/auth"

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

  revalidatePath("/plataforma")
  return { success: `Empresa "${parsed.data.name}" criada.` }
}

"use server"

import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getUser } from "@/lib/auth"
import { getActiveMembership } from "@/lib/tenant"
import {
  acceptInvitationSchema,
  inviteMemberSchema,
} from "@/lib/validations/team"
import { sendTenantEmail } from "@/server/email"

export type TeamFormState =
  { error?: string; success?: string; inviteLink?: string } | undefined

const MANAGER_ROLES = ["owner", "admin"]

async function getBaseUrl() {
  const headerList = await headers()
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host")
  const proto = headerList.get("x-forwarded-proto") ?? "https"
  if (host) return `${proto}://${host}`
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
}

async function countOwners(tenantId: string) {
  const supabase = await createClient()
  const { count } = await supabase
    .from("memberships")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("role", "owner")
    .eq("status", "active")
  return count ?? 0
}

export async function inviteMemberAction(
  _prevState: TeamFormState,
  formData: FormData,
): Promise<TeamFormState> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }
  if (!MANAGER_ROLES.includes(active.role)) {
    return { error: "Você não tem permissão para convidar membros." }
  }

  const parsed = inviteMemberSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role") ?? "member",
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }

  const supabase = await createClient()
  const admin = createAdminClient()

  let existingUserId: string | null = null
  try {
    const { data } = await admin.auth.admin.listUsers({ perPage: 200 })
    existingUserId =
      data?.users.find(
        (user) => (user.email ?? "").toLowerCase() === parsed.data.email,
      )?.id ?? null
  } catch {
    existingUserId = null
  }

  if (existingUserId) {
    const { data: membership } = await supabase
      .from("memberships")
      .select("user_id")
      .eq("tenant_id", active.tenantId)
      .eq("user_id", existingUserId)
      .maybeSingle()
    if (membership) return { error: "Esse e-mail já é membro da empresa." }
  }

  const { data: pending } = await supabase
    .from("invitations")
    .select("id")
    .eq("tenant_id", active.tenantId)
    .eq("email", parsed.data.email)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle()
  if (pending) {
    return { error: "Já existe um convite pendente para este e-mail." }
  }

  const user = await getUser()
  const { data: invitation, error } = await supabase
    .from("invitations")
    .insert({
      tenant_id: active.tenantId,
      email: parsed.data.email,
      role: parsed.data.role,
      invited_by: user?.id ?? null,
    })
    .select("token")
    .single()

  if (error) return { error: error.message }

  const link = `${await getBaseUrl()}/convite/${invitation.token}`
  const result = await sendTenantEmail(supabase, {
    tenantId: active.tenantId,
    templateKey: "member_invite",
    to: parsed.data.email,
    vars: { tenant: active.tenant.name, link },
  })

  revalidatePath("/app/configuracoes")
  return {
    success: result.sent
      ? "Convite enviado por e-mail."
      : "Convite criado. Copie o link abaixo e envie ao convidado.",
    inviteLink: link,
  }
}

export async function updateMemberRoleAction(input: {
  userId: string
  role: string
}) {
  const active = await getActiveMembership()
  if (!active) return
  if (!MANAGER_ROLES.includes(active.role)) return
  if (!["owner", "admin", "member"].includes(input.role)) return

  const supabase = await createClient()
  const { data: current } = await supabase
    .from("memberships")
    .select("role")
    .eq("tenant_id", active.tenantId)
    .eq("user_id", input.userId)
    .maybeSingle()
  if (!current) return

  if (current.role === "owner" && input.role !== "owner") {
    if ((await countOwners(active.tenantId)) <= 1) return
  }

  await supabase
    .from("memberships")
    .update({ role: input.role })
    .eq("tenant_id", active.tenantId)
    .eq("user_id", input.userId)

  revalidatePath("/app/configuracoes")
}

export async function removeMemberAction(formData: FormData) {
  const active = await getActiveMembership()
  if (!active) return
  if (!MANAGER_ROLES.includes(active.role)) return

  const userId = String(formData.get("user_id") ?? "")
  if (!userId) return

  const supabase = await createClient()
  const { data: current } = await supabase
    .from("memberships")
    .select("role")
    .eq("tenant_id", active.tenantId)
    .eq("user_id", userId)
    .maybeSingle()
  if (!current) return

  if (current.role === "owner" && (await countOwners(active.tenantId)) <= 1) {
    return
  }

  await supabase
    .from("memberships")
    .delete()
    .eq("tenant_id", active.tenantId)
    .eq("user_id", userId)

  revalidatePath("/app/configuracoes")
}

export async function revokeInvitationAction(formData: FormData) {
  const active = await getActiveMembership()
  if (!active) return
  if (!MANAGER_ROLES.includes(active.role)) return

  const id = String(formData.get("id") ?? "")
  if (!id) return

  const supabase = await createClient()
  await supabase
    .from("invitations")
    .delete()
    .eq("id", id)
    .eq("tenant_id", active.tenantId)

  revalidatePath("/app/configuracoes")
}

export async function acceptInvitationAction(
  _prevState: TeamFormState,
  formData: FormData,
): Promise<TeamFormState> {
  const token = String(formData.get("token") ?? "")
  if (!token) return { error: "Convite inválido." }

  const parsed = acceptInvitationSchema.safeParse({
    full_name: formData.get("full_name"),
    password: formData.get("password"),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }

  const admin = createAdminClient()
  const { data: invitation } = await admin
    .from("invitations")
    .select("id, tenant_id, email, role, accepted_at, expires_at")
    .eq("token", token)
    .maybeSingle()

  if (!invitation) return { error: "Convite inválido." }
  if (invitation.accepted_at) {
    return { error: "Este convite já foi utilizado." }
  }
  if (new Date(invitation.expires_at) < new Date()) {
    return { error: "Este convite expirou." }
  }

  const email = invitation.email.toLowerCase()
  const supabase = await createClient()

  let userId: string | null = null
  try {
    const { data } = await admin.auth.admin.listUsers({ perPage: 200 })
    userId =
      data?.users.find((user) => (user.email ?? "").toLowerCase() === email)
        ?.id ?? null
  } catch {
    userId = null
  }

  if (userId) {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: parsed.data.password,
    })
    if (signInError) {
      return {
        error: "E-mail já cadastrado. Informe a senha correta da sua conta.",
      }
    }
  } else {
    const { data: created, error: createError } =
      await admin.auth.admin.createUser({
        email,
        password: parsed.data.password,
        email_confirm: true,
        user_metadata: { full_name: parsed.data.full_name },
      })
    if (createError || !created.user) {
      return {
        error: createError?.message ?? "Não foi possível criar a conta.",
      }
    }
    userId = created.user.id

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: parsed.data.password,
    })
    if (signInError) return { error: signInError.message }
  }

  await admin.from("memberships").upsert(
    {
      tenant_id: invitation.tenant_id,
      user_id: userId,
      role: invitation.role,
      status: "active",
    },
    { onConflict: "tenant_id,user_id" },
  )

  await admin
    .from("invitations")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invitation.id)

  redirect("/app")
}

export async function acceptInvitationAsCurrentUserAction(formData: FormData) {
  const token = String(formData.get("token") ?? "")
  if (!token) return

  const user = await getUser()
  if (!user?.email) redirect("/login")

  const admin = createAdminClient()
  const { data: invitation } = await admin
    .from("invitations")
    .select("id, tenant_id, email, role, accepted_at, expires_at")
    .eq("token", token)
    .maybeSingle()

  if (!invitation || invitation.accepted_at) return
  if (new Date(invitation.expires_at) < new Date()) return
  if (invitation.email.toLowerCase() !== user.email.toLowerCase()) return

  await admin.from("memberships").upsert(
    {
      tenant_id: invitation.tenant_id,
      user_id: user.id,
      role: invitation.role,
      status: "active",
    },
    { onConflict: "tenant_id,user_id" },
  )

  await admin
    .from("invitations")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invitation.id)

  redirect("/app")
}

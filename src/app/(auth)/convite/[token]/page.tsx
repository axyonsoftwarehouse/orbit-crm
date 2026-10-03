import Link from "next/link"
import { createAdminClient } from "@/lib/supabase/admin"
import { getUser } from "@/lib/auth"
import { AcceptInvitationForm } from "./accept-invitation-form"

type InvitationRow = {
  email: string
  role: string
  accepted_at: string | null
  expires_at: string
  tenant: { name: string } | null
}

export default async function ConvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const admin = createAdminClient()
  const { data } = await admin
    .from("invitations")
    .select("email, role, accepted_at, expires_at, tenant:tenants(name)")
    .eq("token", token)
    .maybeSingle()

  const invitation = data as unknown as InvitationRow | null
  const user = await getUser()

  let message: string | null = null
  if (!invitation) message = "Convite inválido."
  else if (invitation.accepted_at) message = "Este convite já foi utilizado."
  else if (new Date(invitation.expires_at) < new Date())
    message = "Este convite expirou."

  if (!invitation || message) {
    return (
      <div className="w-full max-w-sm space-y-3 text-center">
        <h1 className="font-heading text-xl font-semibold">Convite</h1>
        <p className="text-muted-foreground text-sm">{message}</p>
        <Link href="/login" className="text-primary text-sm hover:underline">
          Ir para o login
        </Link>
      </div>
    )
  }

  return (
    <AcceptInvitationForm
      token={token}
      email={invitation.email}
      tenantName={invitation.tenant?.name ?? "a empresa"}
      loggedEmail={user?.email ?? null}
    />
  )
}

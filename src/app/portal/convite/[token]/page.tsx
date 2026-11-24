import type { Metadata } from "next"
import Link from "next/link"
import { createAdminClient } from "@/lib/supabase/admin"
import { PortalAuthCard } from "@/components/auth/portal-auth-card"
import { lookupPortalInvitation } from "@/server/portal-invitations"
import { AcceptPortalInviteForm } from "./accept-portal-invite-form"

export const metadata: Metadata = {
  title: "Convite · Portal do cliente",
}

export default async function PortalConvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const lookup = await lookupPortalInvitation(createAdminClient(), token)

  if (!lookup.ok) {
    return (
      <PortalAuthCard title="Convite do portal">
        <div className="space-y-3 text-sm">
          <p>{lookup.message}</p>
          <Link href="/portal/login" className="text-primary hover:underline">
            Ir para o login do portal
          </Link>
        </div>
      </PortalAuthCard>
    )
  }

  const { invitation } = lookup
  return (
    <PortalAuthCard
      title={`Olá, ${invitation.contactName}!`}
      description={
        <>
          <strong>{invitation.tenantName}</strong> liberou seu acesso ao portal
          do cliente. Crie uma senha para entrar.
        </>
      }
    >
      <AcceptPortalInviteForm token={token} email={invitation.email} />
    </PortalAuthCard>
  )
}

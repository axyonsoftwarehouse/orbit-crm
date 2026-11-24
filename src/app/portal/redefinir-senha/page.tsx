import type { Metadata } from "next"
import { PortalAuthCard } from "@/components/auth/portal-auth-card"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"

export const metadata: Metadata = {
  title: "Nova senha · Portal do cliente",
}

export default async function PortalRedefinirSenhaPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  return (
    <PortalAuthCard
      title="Criar nova senha"
      description="Escolha a nova senha do portal."
    >
      <ResetPasswordForm area="portal" token={token ?? ""} />
    </PortalAuthCard>
  )
}

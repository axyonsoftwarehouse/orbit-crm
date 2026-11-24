import type { Metadata } from "next"
import { PortalAuthCard } from "@/components/auth/portal-auth-card"
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"

export const metadata: Metadata = {
  title: "Esqueci minha senha · Portal do cliente",
}

export default function PortalEsqueciSenhaPage() {
  return (
    <PortalAuthCard
      title="Esqueci minha senha"
      description="Informe o e-mail que você usa no portal e enviaremos um link para criar uma nova senha."
    >
      <ForgotPasswordForm area="portal" />
    </PortalAuthCard>
  )
}

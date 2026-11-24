import type { Metadata } from "next"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"

export const metadata: Metadata = {
  title: "Esqueci minha senha",
}

export default function EsqueciSenhaPage() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-lg">Esqueci minha senha</CardTitle>
        <CardDescription>
          Informe o e-mail da sua conta e enviaremos um link para criar uma nova
          senha.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ForgotPasswordForm area="app" />
      </CardContent>
    </Card>
  )
}

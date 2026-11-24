import type { Metadata } from "next"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"

export const metadata: Metadata = {
  title: "Nova senha",
}

export default async function RedefinirSenhaPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-lg">Criar nova senha</CardTitle>
        <CardDescription>Escolha a nova senha da sua conta.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResetPasswordForm area="app" token={token ?? ""} />
      </CardContent>
    </Card>
  )
}

import type { Metadata } from "next"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { APP_NAME } from "@/lib/constants"
import { LoginForm } from "./login-form"

export const metadata: Metadata = {
  title: "Entrar",
}

export default function LoginPage() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <div className="bg-primary text-primary-foreground mb-1 flex size-10 items-center justify-center rounded-xl">
          <span className="font-heading text-lg font-bold">O</span>
        </div>
        <CardTitle className="text-lg">{APP_NAME}</CardTitle>
        <CardDescription>Acesse sua conta para continuar.</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
        <p className="text-muted-foreground mt-4 text-center text-xs">
          É cliente?{" "}
          <a href="/portal/login" className="text-primary hover:underline">
            Acesse o portal
          </a>
        </p>
      </CardContent>
    </Card>
  )
}

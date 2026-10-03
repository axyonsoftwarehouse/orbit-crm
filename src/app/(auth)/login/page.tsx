import type { Metadata } from "next"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DemoCredentials } from "@/components/app/demo-credentials"
import { APP_NAME } from "@/lib/constants"
import { LoginForm } from "./login-form"

export const metadata: Metadata = {
  title: "Entrar",
}

export default function LoginPage() {
  const showDemo = process.env.NEXT_PUBLIC_DEMO_LOGIN !== "false"
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
        {showDemo ? (
          <DemoCredentials
            email="ana@orbit.demo"
            password="OrbitDemo#2026"
            label="Acesso de demonstração (equipe) — outros usuários: bruno@ / carla@ / diego@orbit.demo"
          />
        ) : null}
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

import type { Metadata } from "next"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DemoCredentials } from "@/components/app/demo-credentials"
import { PortalLoginForm } from "./login-form"

export const metadata: Metadata = {
  title: "Portal do cliente",
}

export default function PortalLoginPage() {
  const showDemo = process.env.NEXT_PUBLIC_DEMO_LOGIN === "true"
  return (
    <div className="bg-background flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="bg-primary text-primary-foreground mb-1 flex size-10 items-center justify-center rounded-xl">
            <span className="font-heading text-lg font-bold">O</span>
          </div>
          <CardTitle className="text-lg">Portal do cliente</CardTitle>
          <CardDescription>
            Acompanhe seus projetos, orçamentos e faturas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PortalLoginForm />
          {showDemo ? (
            <DemoCredentials
              email="cliente@orbit.demo"
              password="Portal#2026"
              label="Acesso de demonstração (portal do cliente)"
            />
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

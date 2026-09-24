import type { Metadata } from "next"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { PortalLoginForm } from "./login-form"

export const metadata: Metadata = {
  title: "Portal do cliente",
}

export default function PortalLoginPage() {
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
        </CardContent>
      </Card>
    </div>
  )
}

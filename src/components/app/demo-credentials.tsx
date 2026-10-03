"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export function DemoCredentials({
  email,
  password,
  label,
}: {
  email: string
  password: string
  label: string
}) {
  const [filled, setFilled] = useState(false)

  function fill() {
    const emailInput = document.querySelector<HTMLInputElement>("#email")
    const passwordInput = document.querySelector<HTMLInputElement>("#password")
    if (emailInput && passwordInput) {
      emailInput.value = email
      passwordInput.value = password
      setFilled(true)
    }
  }

  return (
    <div className="bg-muted/50 mt-4 space-y-2 rounded-lg border p-3 text-xs">
      <p className="text-muted-foreground font-medium">{label}</p>
      <p className="font-mono break-all">
        {email}
        <br />
        {password}
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full"
        onClick={fill}
      >
        {filled ? "Credenciais preenchidas" : "Preencher com dados demo"}
      </Button>
    </div>
  )
}

"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Eraser, PenLine } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { canSign } from "@/lib/contracts/sign-form-state"

export type SignActionResult = { ok: true } | { error: string }

type SignFormProps = {
  token: string
  legalText: string | null
  action: (input: {
    token: string
    firstname: string
    lastname?: string
    email: string
    signature: string
    consent: boolean
  }) => Promise<SignActionResult>
}

/**
 * Bloco de assinatura do link público: nome, e-mail, quadro para desenhar e
 * consentimento. O PNG sai do canvas só no envio; nada de imagem intermediária.
 */
export function SignForm({ token, legalText, action }: SignFormProps) {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const [hasStroke, setHasStroke] = useState(false)
  const [firstname, setFirstname] = useState("")
  const [lastname, setLastname] = useState("")
  const [email, setEmail] = useState("")
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const allowed = canSign({ firstname, email, hasStroke, consent })

  function prepareCanvas(canvas: HTMLCanvasElement) {
    const context = canvas.getContext("2d")
    if (!context) return
    const ratio = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    if (canvas.width !== rect.width * ratio) {
      canvas.width = rect.width * ratio
      canvas.height = rect.height * ratio
    }
    context.setTransform(ratio, 0, 0, ratio, 0, 0)
    context.lineWidth = 2
    context.lineCap = "round"
    context.lineJoin = "round"
    context.strokeStyle = "#0f172a"
  }

  function point(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    return { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }

  function onPointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    const context = canvasRef.current?.getContext("2d")
    if (!context) return
    prepareCanvas(canvasRef.current!)
    drawing.current = true
    event.currentTarget.setPointerCapture(event.pointerId)
    const { x, y } = point(event)
    context.beginPath()
    context.moveTo(x, y)
  }

  function onPointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return
    const context = canvasRef.current?.getContext("2d")
    if (!context) return
    const { x, y } = point(event)
    context.lineTo(x, y)
    context.stroke()
    if (!hasStroke) setHasStroke(true)
  }

  function onPointerUp() {
    drawing.current = false
  }

  function clear() {
    const canvas = canvasRef.current
    const context = canvas?.getContext("2d")
    if (!canvas || !context) return
    context.clearRect(0, 0, canvas.width, canvas.height)
    setHasStroke(false)
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!allowed || pending) return
    const canvas = canvasRef.current
    if (!canvas) return
    const signature = canvas.toDataURL("image/png")
    setError(null)
    startTransition(async () => {
      const result = await action({
        token,
        firstname,
        lastname,
        email,
        signature,
        consent,
      })
      if ("error" in result) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="sign-firstname">Nome</Label>
          <Input
            id="sign-firstname"
            value={firstname}
            onChange={(event) => setFirstname(event.target.value)}
            autoComplete="given-name"
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="sign-lastname">Sobrenome</Label>
          <Input
            id="sign-lastname"
            value={lastname}
            onChange={(event) => setLastname(event.target.value)}
            autoComplete="family-name"
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="sign-email">E-mail</Label>
        <Input
          id="sign-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-1.5">
            <PenLine className="size-4" />
            Assine no quadro
          </Label>
          <Button type="button" variant="ghost" size="sm" onClick={clear}>
            <Eraser className="size-4" />
            Limpar
          </Button>
        </div>
        <canvas
          ref={canvasRef}
          className="bg-background h-40 w-full touch-none rounded-xl border border-dashed"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          aria-label="Quadro de assinatura"
        />
      </div>

      <label className="flex items-start gap-2 text-sm">
        <Checkbox
          checked={consent}
          onCheckedChange={(value) => setConsent(value === true)}
          className="mt-0.5"
        />
        <span>
          {legalText?.trim() ||
            "Confirmo que li o contrato e que a assinatura abaixo é minha manifestação de aceite."}
        </span>
      </label>

      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={!allowed || pending} className="w-full">
        {pending ? "Assinando…" : "Assinar contrato"}
      </Button>
    </form>
  )
}

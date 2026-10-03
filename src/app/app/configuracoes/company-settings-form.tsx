"use client"

import { useActionState, useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  updateTenantSettingsAction,
  type TenantSettingsState,
} from "@/server/actions/tenant"

export function CompanySettingsForm({
  name,
  primaryColor,
  logoUrl,
  canEdit,
}: {
  name: string
  primaryColor: string | null
  logoUrl: string | null
  canEdit: boolean
}) {
  const color = /^#[0-9a-fA-F]{6}$/.test(primaryColor ?? "")
    ? (primaryColor as string)
    : "#0062FF"
  const [preview, setPreview] = useState(color)
  const [state, formAction, isPending] = useActionState<
    TenantSettingsState,
    FormData
  >(updateTenantSettingsAction, undefined)

  useEffect(() => {
    if (state?.success) toast.success(state.success)
    else if (state?.error) toast.error(state.error)
  }, [state])

  if (!canEdit) {
    return (
      <div className="space-y-4 rounded-2xl border p-5">
        <div>
          <p className="text-muted-foreground text-xs">Nome</p>
          <p className="text-sm">{name}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Cor primária</p>
          <span className="mt-1 inline-flex items-center gap-2 text-sm">
            <span
              className="size-4 rounded-full"
              style={{ backgroundColor: color }}
            />
            {color}
          </span>
        </div>
        {logoUrl ? (
          <div>
            <p className="text-muted-foreground text-xs">Logo</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoUrl}
              alt="Logo"
              className="mt-1 h-12 w-auto rounded-md border object-contain p-1"
            />
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-5 rounded-2xl border p-5">
      <div className="space-y-2">
        <Label htmlFor="tenant-name">Nome da empresa *</Label>
        <Input
          id="tenant-name"
          name="name"
          defaultValue={name}
          required
          maxLength={120}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tenant-color">Cor primária</Label>
        <div className="flex items-center gap-3">
          <input
            id="tenant-color"
            type="color"
            name="primary_color"
            value={preview}
            onChange={(event) => setPreview(event.target.value)}
            className="h-9 w-14 cursor-pointer rounded-lg border bg-transparent"
          />
          <span className="text-muted-foreground text-sm">{preview}</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tenant-logo">Logo</Label>
        <div className="flex items-center gap-3">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt="Logo"
              className="h-12 w-auto rounded-md border object-contain p-1"
            />
          ) : null}
          <input
            id="tenant-logo"
            type="file"
            name="logo"
            accept="image/*"
            className="text-muted-foreground file:bg-muted block text-sm file:mr-3 file:rounded-full file:border-0 file:px-3 file:py-1.5 file:text-xs"
          />
        </div>
        <p className="text-muted-foreground text-xs">
          PNG, JPG ou SVG · até 2 MB.
        </p>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  )
}

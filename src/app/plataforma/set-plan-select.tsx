"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { setTenantPlanAction } from "@/server/actions/platform"

const fieldClass =
  "border-input bg-background dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3"

export function SetPlanSelect({
  tenantId,
  planId,
  plans,
}: {
  tenantId: string
  planId: string | null
  plans: { id: string; name: string }[]
}) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  return (
    <select
      value={planId ?? ""}
      disabled={isPending}
      onChange={(event) => {
        const formData = new FormData()
        formData.set("tenant_id", tenantId)
        formData.set("plan_id", event.target.value)
        startTransition(async () => {
          await setTenantPlanAction(formData)
          router.refresh()
        })
      }}
      className={fieldClass}
    >
      <option value="">— Sem plano —</option>
      {plans.map((plan) => (
        <option key={plan.id} value={plan.id}>
          {plan.name}
        </option>
      ))}
    </select>
  )
}

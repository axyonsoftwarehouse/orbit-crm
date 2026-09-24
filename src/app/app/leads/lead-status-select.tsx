"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { updateLeadStatusAction } from "@/server/actions/leads"

const fieldClass =
  "border-input bg-background dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3"

export function LeadStatusSelect({
  id,
  statusId,
  statuses,
}: {
  id: string
  statusId: string | null
  statuses: { id: string; name: string }[]
}) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  return (
    <select
      value={statusId ?? ""}
      disabled={isPending}
      onChange={(event) => {
        const formData = new FormData()
        formData.set("id", id)
        formData.set("status_id", event.target.value)
        startTransition(async () => {
          await updateLeadStatusAction(formData)
          router.refresh()
        })
      }}
      className={fieldClass}
    >
      <option value="">— Sem status —</option>
      {statuses.map((status) => (
        <option key={status.id} value={status.id}>
          {status.name}
        </option>
      ))}
    </select>
  )
}

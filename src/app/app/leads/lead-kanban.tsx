"use client"

import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { formatMoney } from "@/lib/format"
import { cn } from "@/lib/utils"
import { setLeadStatusAction } from "@/server/actions/leads"
import type { LeadListRow, LeadStatus } from "@/server/queries/leads"

type Column = { id: string; name: string; color: string }

export function LeadKanban({
  statuses,
  leads: initialLeads,
}: {
  statuses: LeadStatus[]
  leads: LeadListRow[]
}) {
  const [leads, setLeads] = useState(initialLeads)
  const [dragId, setDragId] = useState<string | null>(null)
  const [overColumn, setOverColumn] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const router = useRouter()

  useEffect(() => {
    setLeads(initialLeads)
  }, [initialLeads])

  const columns: Column[] = [
    ...statuses.map((s) => ({ id: s.id, name: s.name, color: s.color })),
    { id: "", name: "Sem status", color: "#92929d" },
  ]

  function move(id: string, columnId: string) {
    const status = columnId
      ? (statuses.find((s) => s.id === columnId) ?? null)
      : null
    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === id
          ? {
              ...lead,
              status: status
                ? { id: status.id, name: status.name, color: status.color }
                : null,
            }
          : lead,
      ),
    )
    startTransition(async () => {
      await setLeadStatusAction({ id, statusId: columnId || null })
      router.refresh()
    })
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {columns.map((column) => {
        const items = leads.filter((lead) =>
          column.id ? lead.status?.id === column.id : !lead.status,
        )
        return (
          <div
            key={column.id || "none"}
            onDragOver={(event) => {
              event.preventDefault()
              setOverColumn(column.id)
            }}
            onDragLeave={() => setOverColumn(null)}
            onDrop={(event) => {
              event.preventDefault()
              const id = event.dataTransfer.getData("text/plain")
              setOverColumn(null)
              setDragId(null)
              if (id) move(id, column.id)
            }}
            className={cn(
              "flex w-72 shrink-0 flex-col gap-3 rounded-2xl p-3 transition-colors",
              overColumn === column.id
                ? "bg-primary/10 ring-primary/40 ring-2"
                : "bg-muted/40",
            )}
          >
            <div className="flex items-center justify-between px-1">
              <span className="font-heading flex items-center gap-2 text-sm font-semibold">
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: column.color }}
                />
                {column.name}
              </span>
              <span className="text-muted-foreground text-xs">
                {items.length}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {items.map((lead) => (
                <div
                  key={lead.id}
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData("text/plain", lead.id)
                    event.dataTransfer.effectAllowed = "move"
                    setDragId(lead.id)
                  }}
                  onDragEnd={() => setDragId(null)}
                  className={cn(
                    "bg-card cursor-grab rounded-xl border p-3 shadow-sm transition-opacity",
                    dragId === lead.id && "opacity-50",
                  )}
                >
                  <Link
                    href={`/app/leads/${lead.id}`}
                    className="font-heading text-sm font-semibold hover:underline"
                  >
                    {lead.name}
                  </Link>
                  <div className="text-muted-foreground truncate text-xs">
                    {lead.company ?? "—"}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground truncate">
                      {lead.source?.name ?? ""}
                    </span>
                    <span className="text-sm font-medium">
                      {lead.value !== null
                        ? formatMoney(Number(lead.value))
                        : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

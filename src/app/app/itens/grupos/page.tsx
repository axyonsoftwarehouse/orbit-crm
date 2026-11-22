import Link from "next/link"
import { ArrowLeft, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getMemberships } from "@/lib/auth"
import { getActiveTenant } from "@/lib/tenant"
import { isManager } from "@/server/permissions"
import { listItemGroups } from "@/server/queries/items"
import { GroupFormDialog } from "./group-form-dialog"
import { DeleteGroupDialog } from "./delete-group-dialog"

export default async function ItemGroupsPage() {
  const memberships = await getMemberships()
  const active = await getActiveTenant(memberships)
  if (!active) return null

  const groups = await listItemGroups(active.tenantId)
  const canManage = isManager(active.role)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <Button variant="ghost" size="sm" render={<Link href="/app/itens" />}>
            <ArrowLeft className="size-4" />
            Itens
          </Button>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Grupos de itens
            </h1>
            <p className="text-muted-foreground text-sm">
              {groups.length} grupo(s) · organize o catálogo.
            </p>
          </div>
        </div>
        {canManage ? <GroupFormDialog label="Novo grupo" /> : null}
      </div>

      <div className="bg-card overflow-hidden rounded-2xl border shadow-[0_6px_24px_-14px_rgba(23,23,37,0.18)] dark:shadow-none">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Grupo</TableHead>
              <TableHead>Itens</TableHead>
              <TableHead className="w-0" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  <div className="text-muted-foreground flex flex-col items-center gap-1 text-sm">
                    <Layers className="size-5" />
                    Nenhum grupo cadastrado.
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              groups.map((group) => (
                <TableRow key={group.id}>
                  <TableCell className="font-medium">{group.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {group.count}
                  </TableCell>
                  <TableCell className="text-right">
                    {canManage ? (
                      <div className="flex items-center justify-end gap-1">
                        <GroupFormDialog
                          group={{ id: group.id, name: group.name }}
                          label="Editar"
                        />
                        <DeleteGroupDialog
                          group={{
                            id: group.id,
                            name: group.name,
                            count: group.count,
                          }}
                          groups={groups.map((item) => ({
                            id: item.id,
                            name: item.name,
                          }))}
                        />
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">
                        somente leitura
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

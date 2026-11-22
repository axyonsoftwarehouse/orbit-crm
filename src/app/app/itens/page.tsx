import Link from "next/link"
import { Layers, Package } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Pagination } from "@/components/app/pagination"
import { formatMoney } from "@/lib/format"
import { getMemberships } from "@/lib/auth"
import { getActiveTenant } from "@/lib/tenant"
import { PAGE_SIZE, parsePage } from "@/lib/pagination"
import { isManager } from "@/server/permissions"
import { listItemGroups, listItemsPage } from "@/server/queries/items"
import { toggleItemActiveAction } from "@/server/actions/items"
import { ItemFormDialog } from "./item-form-dialog"
import { DeleteItemButton } from "./delete-item-button"
import { DuplicateItemButton } from "./duplicate-item-button"

const fieldClass =
  "border-input bg-background dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 h-8 rounded-lg border px-2 text-sm outline-none focus-visible:ring-3"

export default async function ItemsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string
    q?: string
    group?: string
    status?: string
  }>
}) {
  const { page: pageParam, q, group, status } = await searchParams
  const page = parsePage(pageParam)
  const memberships = await getMemberships()
  const active = await getActiveTenant(memberships)
  if (!active) return null

  const [{ rows: items, total }, groups] = await Promise.all([
    listItemsPage(active.tenantId, {
      page,
      pageSize: PAGE_SIZE,
      search: q,
      groupId: group,
      status:
        status === "inactive" || status === "all"
          ? status
          : status === "active"
            ? "active"
            : undefined,
    }),
    listItemGroups(active.tenantId),
  ])

  const groupOptions = groups.map((item) => ({
    id: item.id,
    name: item.name,
  }))
  const canManage = isManager(active.role)
  const hasFilters = Boolean(q || group || (status && status !== "active"))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Itens</h1>
          <p className="text-muted-foreground text-sm">
            {total} item(ns) · produtos e serviços reutilizáveis em documentos.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            render={<Link href="/app/itens/grupos" />}
          >
            <Layers className="size-4" />
            Grupos
          </Button>
          <ItemFormDialog groups={groupOptions} label="Novo item" />
        </div>
      </div>

      <form
        method="get"
        action="/app/itens"
        className="flex flex-wrap items-end gap-2"
      >
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Buscar por descrição"
          className={`${fieldClass} min-w-56`}
        />
        <select name="group" defaultValue={group ?? ""} className={fieldClass}>
          <option value="">Todos os grupos</option>
          {groupOptions.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={status ?? ""}
          className={fieldClass}
        >
          <option value="">Ativos</option>
          <option value="inactive">Inativos</option>
          <option value="all">Todos</option>
        </select>
        <Button type="submit" variant="outline" size="sm">
          Filtrar
        </Button>
        {hasFilters ? (
          <Link
            href="/app/itens"
            className="text-muted-foreground text-sm hover:underline"
          >
            Limpar
          </Link>
        ) : null}
      </form>

      <div className="bg-card overflow-hidden rounded-2xl border shadow-[0_6px_24px_-14px_rgba(23,23,37,0.18)] dark:shadow-none">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Grupo</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Imposto</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead className="w-0" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <div className="text-muted-foreground flex flex-col items-center gap-1 text-sm">
                    <Package className="size-5" />
                    {hasFilters
                      ? "Nenhum item encontrado com esses filtros."
                      : "Nenhum item cadastrado ainda."}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="max-w-72">
                    <span className="block truncate font-medium">
                      {item.description}
                    </span>
                    {item.long_description ? (
                      <span className="text-muted-foreground block truncate text-xs">
                        {item.long_description}
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.group?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.unit ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatMoney(Number(item.rate))}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.tax_name
                      ? `${item.tax_name} · ${item.tax_rate ?? 0}%`
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.active ? "secondary" : "outline"}>
                      {item.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <ItemFormDialog
                        item={item}
                        groups={groupOptions}
                        label="Editar"
                      />
                      <DuplicateItemButton id={item.id} />
                      <form action={toggleItemActiveAction}>
                        <input type="hidden" name="id" value={item.id} />
                        <Button type="submit" variant="ghost" size="sm">
                          {item.active ? "Desativar" : "Ativar"}
                        </Button>
                      </form>
                      {canManage ? <DeleteItemButton id={item.id} /> : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination
        page={page}
        total={total}
        hrefFor={(target) => {
          const params = new URLSearchParams()
          if (q) params.set("q", q)
          if (group) params.set("group", group)
          if (status) params.set("status", status)
          if (target > 1) params.set("page", String(target))
          const query = params.toString()
          return query ? `/app/itens?${query}` : "/app/itens"
        }}
      />
    </div>
  )
}

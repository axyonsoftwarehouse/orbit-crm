import Link from "next/link"
import { MessageSquare } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ExportButton } from "@/components/app/export-button"
import { Pagination } from "@/components/app/pagination"
import {
  SocialProviderBadge,
  SocialStatusBadge,
} from "@/components/app/social-bits"
import { formatDate } from "@/lib/format"
import { getMemberships } from "@/lib/auth"
import { getActiveTenant } from "@/lib/tenant"
import { PAGE_SIZE, parsePage } from "@/lib/pagination"
import { SOCIAL_POST_STATUSES } from "@/lib/constants"
import { listCompanies } from "@/server/queries/companies"
import {
  listSocialAccounts,
  listSocialPostsPage,
} from "@/server/queries/social"
import { SocialPostFormDialog } from "./social-post-form-dialog"

const fieldClass =
  "border-input bg-background dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 h-8 rounded-lg border px-2 text-sm outline-none focus-visible:ring-3"

export default async function SocialPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; company?: string }>
}) {
  const { page: pageParam, status, company } = await searchParams
  const page = parsePage(pageParam)
  const memberships = await getMemberships()
  const active = await getActiveTenant(memberships)
  if (!active) return null

  const [companies, accounts, { rows: posts, total }] = await Promise.all([
    listCompanies(active.tenantId),
    listSocialAccounts(active.tenantId),
    listSocialPostsPage(active.tenantId, {
      page,
      pageSize: PAGE_SIZE,
      status,
      companyId: company,
    }),
  ])

  const companyOptions = companies.map((item) => ({
    id: item.id,
    name: item.name,
  }))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Social</h1>
          <p className="text-muted-foreground text-sm">
            {total} post(s) e {accounts.length} conta(s) conectada(s).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ExportButton href="/app/exportar/social" />
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href="/app/social/calendario" />}
          >
            Calendário
          </Button>
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href="/app/social/contas" />}
          >
            Contas
          </Button>
          <SocialPostFormDialog
            companies={companyOptions}
            accounts={accounts}
          />
        </div>
      </div>

      <form
        method="get"
        action="/app/social"
        className="flex flex-wrap items-end gap-2"
      >
        <select
          name="company"
          defaultValue={company ?? ""}
          className={fieldClass}
        >
          <option value="">Todos os clientes</option>
          {companyOptions.map((item) => (
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
          <option value="">Todos os status</option>
          {Object.entries(SOCIAL_POST_STATUSES).map(([value, config]) => (
            <option key={value} value={value}>
              {config.label}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline" size="sm">
          Filtrar
        </Button>
        {company || status ? (
          <Link
            href="/app/social"
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
              <TableHead>Post</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Redes</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Agendado</TableHead>
              <TableHead className="w-0" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="text-muted-foreground flex flex-col items-center gap-1 text-sm">
                    <MessageSquare className="size-5" />
                    Nenhum post cadastrado ainda.
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell>
                    <Link
                      href={`/app/social/${post.id}`}
                      className="line-clamp-2 max-w-[360px] text-sm font-medium hover:underline"
                    >
                      {post.content}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {post.company?.name ?? "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {post.targets.map((target) => (
                        <SocialProviderBadge
                          key={target.id}
                          provider={target.provider}
                        />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <SocialStatusBadge status={post.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(post.scheduled_at)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      nativeButton={false}
                      render={<Link href={`/app/social/${post.id}`} />}
                    >
                      Abrir
                    </Button>
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
          if (status) params.set("status", status)
          if (company) params.set("company", company)
          if (target > 1) params.set("page", String(target))
          const query = params.toString()
          return query ? `/app/social?${query}` : "/app/social"
        }}
      />
    </div>
  )
}

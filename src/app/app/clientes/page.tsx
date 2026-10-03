import Link from "next/link"
import { Users } from "lucide-react"
import { EntityAvatar } from "@/components/app/entity-avatar"
import { TagFilter } from "@/components/app/tag-filter"
import { Pagination } from "@/components/app/pagination"
import { ExportButton } from "@/components/app/export-button"
import { ImportCsvDialog } from "@/components/app/import-csv-dialog"
import { getMemberships } from "@/lib/auth"
import { getActiveTenant } from "@/lib/tenant"
import { PAGE_SIZE, parsePage } from "@/lib/pagination"
import {
  countContactsByCompany,
  listCompaniesPage,
} from "@/server/queries/companies"
import { entityIdsByTag, listTags } from "@/server/queries/tags"
import { listCustomFieldDefinitions } from "@/server/queries/custom-fields"
import { importCompaniesAction } from "@/server/actions/import"
import { CompanyFormDialog } from "./company-form-dialog"

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; page?: string }>
}) {
  const { tag, page: pageParam } = await searchParams
  const page = parsePage(pageParam)
  const memberships = await getMemberships()
  const active = await getActiveTenant(memberships)
  if (!active) return null

  const tagIds = tag
    ? await entityIdsByTag(active.tenantId, "company", tag)
    : undefined

  const [{ rows: companies, total }, counts, tags, customFields] =
    await Promise.all([
      listCompaniesPage(active.tenantId, {
        page,
        pageSize: PAGE_SIZE,
        ids: tagIds,
      }),
      countContactsByCompany(active.tenantId),
      listTags(active.tenantId),
      listCustomFieldDefinitions(active.tenantId, "company"),
    ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground text-sm">
            {total} empresa(s) · contatos, telefone e localização.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ExportButton href="/app/exportar/clientes" />
          <ImportCsvDialog
            action={importCompaniesAction}
            hint="Colunas: Nome; Telefone; Site; Cidade; País (cabeçalho opcional)."
          />
          <CompanyFormDialog label="Novo cliente" customFields={customFields} />
        </div>
      </div>

      <TagFilter
        tags={tags}
        active={tag}
        hrefFor={(tagId) =>
          tagId ? `/app/clientes?tag=${tagId}` : "/app/clientes"
        }
      />

      {companies.length === 0 ? (
        <div className="text-muted-foreground rounded-2xl border border-dashed p-12 text-center text-sm">
          Nenhum cliente cadastrado ainda.
        </div>
      ) : (
        <section className="bg-card overflow-hidden rounded-2xl border shadow-[0_6px_24px_-14px_rgba(23,23,37,0.18)] dark:shadow-none">
          <div className="divide-y">
            {companies.map((company) => (
              <Link
                key={company.id}
                href={`/app/clientes/${company.id}`}
                className="hover:bg-muted/40 flex items-center gap-4 px-5 py-4"
              >
                <EntityAvatar name={company.name} />
                <div className="min-w-0 flex-1">
                  <div className="font-heading text-sm font-semibold">
                    {company.name}
                  </div>
                  <div className="text-muted-foreground truncate text-xs">
                    {[company.city, company.country]
                      .filter(Boolean)
                      .join(", ") || "—"}
                  </div>
                </div>
                <div className="text-muted-foreground hidden text-sm md:block">
                  {company.phone ?? "—"}
                </div>
                <span className="bg-muted text-muted-foreground inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium">
                  <Users className="size-3.5" />
                  {counts[company.id] ?? 0}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <Pagination
        page={page}
        total={total}
        hrefFor={(target) => {
          const params = new URLSearchParams()
          if (tag) params.set("tag", tag)
          if (target > 1) params.set("page", String(target))
          const query = params.toString()
          return query ? `/app/clientes?${query}` : "/app/clientes"
        }}
      />
    </div>
  )
}

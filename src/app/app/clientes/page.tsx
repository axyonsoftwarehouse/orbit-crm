import Link from "next/link"
import { Users } from "lucide-react"
import { EntityAvatar } from "@/components/app/entity-avatar"
import { getMemberships } from "@/lib/auth"
import { getActiveTenant } from "@/lib/tenant"
import {
  countContactsByCompany,
  listCompanies,
} from "@/server/queries/companies"
import { CompanyFormDialog } from "./company-form-dialog"

export default async function ClientesPage() {
  const memberships = await getMemberships()
  const active = await getActiveTenant(memberships)
  if (!active) return null

  const [companies, counts] = await Promise.all([
    listCompanies(active.tenantId),
    countContactsByCompany(active.tenantId),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground text-sm">
            {companies.length} empresa(s) · contatos, telefone e localização.
          </p>
        </div>
        <CompanyFormDialog label="Novo cliente" />
      </div>

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
    </div>
  )
}

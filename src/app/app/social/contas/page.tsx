import { SocialProviderBadge } from "@/components/app/social-bits"
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
import { listCompanies } from "@/server/queries/companies"
import { listSocialAccounts } from "@/server/queries/social"
import { DeleteSocialAccountButton } from "./delete-social-account-button"
import { SocialAccountFormDialog } from "./social-account-form-dialog"

export default async function SocialAccountsPage() {
  const memberships = await getMemberships()
  const active = await getActiveTenant(memberships)
  if (!active) return null

  const [companies, accounts] = await Promise.all([
    listCompanies(active.tenantId),
    listSocialAccounts(active.tenantId),
  ])

  const companyOptions = companies.map((company) => ({
    id: company.id,
    name: company.name,
  }))
  const companyMap = new Map(
    companyOptions.map((company) => [company.id, company.name]),
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Contas sociais
          </h1>
          <p className="text-muted-foreground text-sm">
            {accounts.length} conta(s) cadastrada(s) para o tenant.
          </p>
        </div>
        {isManager(active.role) ? (
          <SocialAccountFormDialog companies={companyOptions} />
        ) : null}
      </div>

      <div className="bg-card overflow-hidden rounded-2xl border shadow-[0_6px_24px_-14px_rgba(23,23,37,0.18)] dark:shadow-none">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Conta</TableHead>
              <TableHead>Rede</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-0" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-muted-foreground h-24 text-center text-sm"
                >
                  Nenhuma conta cadastrada. Adicione uma conta para começar.
                </TableCell>
              </TableRow>
            ) : (
              accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium">
                    {account.display_name}
                  </TableCell>
                  <TableCell>
                    <SocialProviderBadge provider={account.provider} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {account.company_id
                      ? (companyMap.get(account.company_id) ?? "—")
                      : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {account.status === 1 ? "Conectada" : "Indisponível"}
                  </TableCell>
                  <TableCell className="text-right">
                    {isManager(active.role) ? (
                      <DeleteSocialAccountButton id={account.id} />
                    ) : null}
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

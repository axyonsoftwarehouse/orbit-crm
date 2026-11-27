import { SocialProviderBadge } from "@/components/app/social-bits"
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
import { socialNativeEnabled } from "@/lib/env"
import { getActiveTenant } from "@/lib/tenant"
import { isManager } from "@/server/permissions"
import { upgradeHint } from "@/server/plan-limits"
import { listCompanies } from "@/server/queries/companies"
import { listSocialAccounts } from "@/server/queries/social"
import { getSocialProvider } from "@/server/social"
import { DeleteSocialAccountButton } from "./delete-social-account-button"
import { SocialAccountFormDialog } from "./social-account-form-dialog"

const ERROR_MESSAGES: Record<string, string> = {
  permission: "Apenas owner/admin podem conectar contas.",
  disabled: "A publicação nativa está desativada no ambiente.",
  provider: "Provedor não suportado ou não configurado.",
  not_configured: "Configure as credenciais do app no ambiente.",
  account_type: "Tipo de conta inválido para esta rede.",
  denied: "A autorização foi cancelada.",
  state: "A sessão de conexão expirou. Tente novamente.",
  code: "O provedor não retornou o código de autorização.",
  oauth: "Não foi possível concluir a conexão.",
}

function accountStatus(account: {
  status: number
  token_expires_at: string | null
}) {
  if (account.status !== 1) return "Desconectada"
  if (!account.token_expires_at) return "Manual"
  if (new Date(account.token_expires_at).getTime() < Date.now()) {
    return "Token expirado"
  }
  return "Conectada"
}

export default async function SocialAccountsPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string
    connected?: string
    detail?: string
  }>
}) {
  const { error, connected, detail } = await searchParams
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

  const nativeEnabled = socialNativeEnabled()
  const instagram = getSocialProvider("instagram")
  const linkedin = getSocialProvider("linkedin")
  const nativeConfigured =
    Boolean(instagram?.isConfigured) || Boolean(linkedin?.isConfigured)
  const detailMessages: Record<string, string> = {
    invalid_scope:
      "O app LinkedIn ainda não tem acesso à Página (Marketing Developer Platform).",
    unauthorized_scope_error:
      "O app LinkedIn ainda não tem acesso à Página (Marketing Developer Platform).",
    insufficient_developer_role:
      "Adicione a conta como tester no app Meta e aceite o convite no Instagram.",
    linkedin_organization:
      "Não foi possível acessar a Página. Confirme o Marketing Developer Platform e que você é admin da Página.",
    instagram_tester:
      "Adicione a conta como tester no app Meta e aceite o convite no Instagram.",
  }
  const errorMessage =
    (detail && detailMessages[detail]) ??
    (error === "plan_limit"
      ? `Seu plano não permite mais contas sociais. ${upgradeHint("manager")}`
      : error
        ? ERROR_MESSAGES[error]
        : null)

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
          <SocialAccountFormDialog
            companies={companyOptions}
            nativeEnabled={nativeEnabled}
          />
        ) : null}
      </div>

      {errorMessage ? (
        <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-xl border px-4 py-3 text-sm">
          {errorMessage}
        </div>
      ) : null}
      {connected ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
          Conta conectada com sucesso.
        </div>
      ) : null}

      {nativeEnabled && isManager(active.role) ? (
        <div className="bg-card space-y-3 rounded-2xl border p-4">
          <div>
            <h2 className="text-sm font-semibold">Publicação automática</h2>
            <p className="text-muted-foreground text-sm">
              Conecte por OAuth para publicar direto pelo Instagram e LinkedIn.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <form action="/api/social/connect/instagram">
              <Button type="submit" size="sm">
                Conectar Instagram
              </Button>
            </form>
            <form action="/api/social/connect/linkedin">
              <input type="hidden" name="type" value="member" />
              <Button type="submit" size="sm" variant="outline">
                Conectar LinkedIn (perfil)
              </Button>
            </form>
            <form action="/api/social/connect/linkedin">
              <input type="hidden" name="type" value="organization" />
              <Button type="submit" size="sm" variant="outline">
                Conectar LinkedIn (Página)
              </Button>
            </form>
          </div>
          {!nativeConfigured ? (
            <p className="text-muted-foreground text-xs">
              Antes de conectar, configure INSTAGRAM_APP_ID/INSTAGRAM_APP_SECRET
              e LINKEDIN_CLIENT_ID/LINKEDIN_CLIENT_SECRET no ambiente.
            </p>
          ) : null}
        </div>
      ) : null}

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
                  Nenhuma conta cadastrada. Conecte ou adicione uma conta para
                  começar.
                </TableCell>
              </TableRow>
            ) : (
              accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium">
                    <div>{account.display_name}</div>
                    <div className="text-muted-foreground text-xs">
                      {account.account_type === "organization"
                        ? "Página"
                        : account.account_type === "member"
                          ? "Perfil"
                          : account.account_type}
                    </div>
                  </TableCell>
                  <TableCell>
                    <SocialProviderBadge provider={account.provider} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {account.company_id
                      ? (companyMap.get(account.company_id) ?? "—")
                      : "Agência"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {accountStatus(account)}
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

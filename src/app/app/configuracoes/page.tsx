import Link from "next/link"
import { cn } from "@/lib/utils"
import { getMemberships } from "@/lib/auth"
import { getActiveTenant } from "@/lib/tenant"
import { listTags } from "@/server/queries/tags"
import { listCustomFieldDefinitionsAll } from "@/server/queries/custom-fields"
import { listPendingInvitations, listTeamMembers } from "@/server/queries/team"
import { TagsSection } from "./tags-section"
import { CustomFieldsSection } from "./custom-fields-section"
import { CompanySettingsForm } from "./company-settings-form"
import { TeamSection } from "./team-section"

const TABS = [
  { key: "empresa", label: "Empresa" },
  { key: "equipe", label: "Equipe" },
  { key: "tags", label: "Tags" },
  { key: "campos", label: "Campos personalizados" },
]

export default async function ConfiguracoesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab = "empresa" } = await searchParams
  const memberships = await getMemberships()
  const active = await getActiveTenant(memberships)
  if (!active) return null

  const canManage = ["owner", "admin"].includes(active.role)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground text-sm">
          Empresa, equipe, tags e campos personalizados.
        </p>
      </div>

      <div className="flex flex-wrap gap-1 border-b">
        {TABS.map((item) => (
          <Link
            key={item.key}
            href={`/app/configuracoes?tab=${item.key}`}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm",
              tab === item.key
                ? "border-primary text-primary font-medium"
                : "text-muted-foreground hover:text-foreground border-transparent",
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {tab === "equipe" ? (
        <TeamContent tenantId={active.tenant.id} canManage={canManage} />
      ) : tab === "tags" ? (
        <TagsContent tenantId={active.tenant.id} />
      ) : tab === "campos" ? (
        <CustomFieldsContent tenantId={active.tenant.id} />
      ) : (
        <CompanySettingsForm
          name={active.tenant.name}
          primaryColor={active.tenant.primaryColor}
          logoUrl={active.tenant.logoUrl}
          canEdit={canManage}
        />
      )}
    </div>
  )
}

async function TeamContent({
  tenantId,
  canManage,
}: {
  tenantId: string
  canManage: boolean
}) {
  const [members, invitations] = await Promise.all([
    listTeamMembers(tenantId),
    canManage ? listPendingInvitations(tenantId) : Promise.resolve([]),
  ])
  return (
    <TeamSection
      members={members}
      invitations={invitations}
      canManage={canManage}
    />
  )
}

async function TagsContent({ tenantId }: { tenantId: string }) {
  const tags = await listTags(tenantId)
  return <TagsSection tags={tags} />
}

async function CustomFieldsContent({ tenantId }: { tenantId: string }) {
  const definitions = await listCustomFieldDefinitionsAll(tenantId)
  return <CustomFieldsSection definitions={definitions} />
}

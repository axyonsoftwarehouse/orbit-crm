import Link from "next/link"
import { cn } from "@/lib/utils"
import { getMemberships } from "@/lib/auth"
import { getActiveTenant } from "@/lib/tenant"
import { listTags } from "@/server/queries/tags"
import { listCustomFieldDefinitionsAll } from "@/server/queries/custom-fields"
import { TagsSection } from "./tags-section"
import { CustomFieldsSection } from "./custom-fields-section"

const TABS = [
  { key: "tags", label: "Tags" },
  { key: "campos", label: "Campos personalizados" },
]

export default async function ConfiguracoesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab = "tags" } = await searchParams
  const memberships = await getMemberships()
  const active = await getActiveTenant(memberships)
  if (!active) return null

  const [tags, definitions] = await Promise.all([
    listTags(active.tenantId),
    listCustomFieldDefinitionsAll(active.tenantId),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground text-sm">
          Tags e campos personalizados da empresa.
        </p>
      </div>

      <div className="flex gap-1 border-b">
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

      {tab === "campos" ? (
        <CustomFieldsSection definitions={definitions} />
      ) : (
        <TagsSection tags={tags} />
      )}
    </div>
  )
}

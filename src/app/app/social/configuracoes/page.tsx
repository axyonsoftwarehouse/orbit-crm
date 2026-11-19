import { redirect } from "next/navigation"
import { getMemberships } from "@/lib/auth"
import { getActiveTenant } from "@/lib/tenant"
import { isManager } from "@/server/permissions"
import { getSocialSettings } from "@/server/queries/social"
import { SocialSettingsForm } from "./social-settings-form"

export default async function SocialSettingsPage() {
  const memberships = await getMemberships()
  const active = await getActiveTenant(memberships)
  if (!active) return null
  if (!isManager(active.role)) redirect("/app/social")

  const settings = await getSocialSettings(active.tenantId)

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          Configurações do Social
        </h1>
        <p className="text-muted-foreground text-sm">
          Regras que valem para todos os posts da empresa.
        </p>
      </div>
      <SocialSettingsForm approvalRequired={settings.approval_required} />
    </div>
  )
}

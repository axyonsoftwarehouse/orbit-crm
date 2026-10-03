import { notFound } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/admin"
import { PublicLeadForm } from "./public-lead-form"

export default async function PublicLeadPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const admin = createAdminClient()
  const { data: tenant } = await admin
    .from("tenants")
    .select("name, web_to_lead_enabled")
    .eq("slug", slug)
    .maybeSingle()

  if (!tenant || !tenant.web_to_lead_enabled) notFound()

  return (
    <div className="bg-muted/30 flex min-h-svh items-center justify-center p-6">
      <div className="bg-card w-full max-w-md space-y-5 rounded-2xl border p-6 shadow-sm">
        <div className="space-y-1 text-center">
          <h1 className="font-heading text-xl font-semibold">{tenant.name}</h1>
          <p className="text-muted-foreground text-sm">
            Deixe seus dados e entraremos em contato.
          </p>
        </div>
        <PublicLeadForm slug={slug} />
      </div>
    </div>
  )
}

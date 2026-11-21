import type { SupabaseClient } from "@supabase/supabase-js"

/** Tudo que a página pública e o PDF do contrato mostram. */
export type ContractView = {
  id: string
  title: string
  /** Conteúdo congelado no aceite; senão o corpo com placeholders. */
  body: string
  value: number | null
  startDate: string | null
  endDate: string | null
  status: number
  signedAt: string | null
  /** URL assinada (5 min) do PNG da assinatura. */
  signatureUrl: string | null
  acceptance: {
    firstname: string | null
    lastname: string | null
    email: string | null
    date: string | null
    ip: string | null
    userAgent: string | null
    hash: string | null
  } | null
  company: {
    name: string
    vat: string | null
    address: string | null
    city: string | null
    state: string | null
    zip: string | null
    country: string | null
  } | null
  tenant: {
    name: string
    logoUrl: string | null
    primaryColor: string | null
    legalText: string | null
  }
}

type ContractRow = {
  id: string
  company_id: string | null
  title: string
  content: string | null
  content_rendered: string | null
  description: string | null
  value: number | string | null
  start_date: string | null
  end_date: string | null
  status: number
  signed_at: string | null
  signature_path: string | null
  content_hash: string | null
  acceptance_firstname: string | null
  acceptance_lastname: string | null
  acceptance_email: string | null
  acceptance_date: string | null
  acceptance_ip: string | null
  acceptance_user_agent: string | null
}

/**
 * Carrega o contrato para a página pública e o PDF. Recebe o client admin
 * (depois de validar o token) ou o do usuário; sempre filtra por tenant.
 */
export async function loadContractView(
  supabase: SupabaseClient,
  tenantId: string,
  contractId: string,
): Promise<ContractView | null> {
  const { data } = await supabase
    .from("contracts")
    .select(
      "id, company_id, title, content, content_rendered, description, value, start_date, end_date, status, signed_at, signature_path, content_hash, acceptance_firstname, acceptance_lastname, acceptance_email, acceptance_date, acceptance_ip, acceptance_user_agent",
    )
    .eq("id", contractId)
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .maybeSingle()

  const row = data as ContractRow | null
  if (!row) return null

  const [{ data: tenantData }, { data: companyData }] = await Promise.all([
    supabase
      .from("tenants")
      .select("name, logo_url, primary_color, e_sign_legal_text")
      .eq("id", tenantId)
      .maybeSingle(),
    row.company_id
      ? supabase
          .from("companies")
          .select("name, vat, address, city, state, zip, country")
          .eq("id", row.company_id)
          .eq("tenant_id", tenantId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const tenant = tenantData as {
    name: string
    logo_url: string | null
    primary_color: string | null
    e_sign_legal_text: string | null
  } | null

  let signatureUrl: string | null = null
  if (row.signed_at && row.signature_path) {
    const signed = await supabase.storage
      .from("contracts")
      .createSignedUrl(row.signature_path, 300)
    signatureUrl = signed.data?.signedUrl ?? null
  }

  return {
    id: row.id,
    title: row.title,
    body: row.content_rendered ?? row.content ?? row.description ?? "",
    value: row.value === null ? null : Number(row.value),
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
    signedAt: row.signed_at,
    signatureUrl,
    acceptance: row.signed_at
      ? {
          firstname: row.acceptance_firstname,
          lastname: row.acceptance_lastname,
          email: row.acceptance_email,
          date: row.acceptance_date,
          ip: row.acceptance_ip,
          userAgent: row.acceptance_user_agent,
          hash: row.content_hash,
        }
      : null,
    company: (companyData as ContractView["company"]) ?? null,
    tenant: {
      name: tenant?.name ?? "",
      logoUrl: tenant?.logo_url ?? null,
      primaryColor: tenant?.primary_color ?? null,
      legalText: tenant?.e_sign_legal_text ?? null,
    },
  }
}

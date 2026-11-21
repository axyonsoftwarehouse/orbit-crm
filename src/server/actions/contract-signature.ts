"use server"

import { randomUUID } from "node:crypto"
import { createAdminClient } from "@/lib/supabase/admin"
import { logger } from "@/lib/logger"
import { todayIso } from "@/lib/format"
import {
  hashContractContent,
  contractVars,
  renderContractTemplate,
} from "@/lib/contracts/template"
import { decodeSignatureDataUrl } from "@/lib/contracts/signature"
import { signContractSchema } from "@/lib/validations/contracts"
import { resolveDocumentLink } from "@/server/document-sharing/links"
import { getClientIp, isRateLimited } from "@/server/rate-limit"

const INVALID = "Link inválido ou expirado."
const BUCKET = "contracts"

type ContractRow = {
  id: string
  tenant_id: string
  company_id: string | null
  title: string
  content: string | null
  content_rendered: string | null
  value: number | string | null
  start_date: string | null
  end_date: string | null
  signed_at: string | null
  deleted_at: string | null
}

/**
 * Aceite do contrato pelo link público: valida o token, confere a assinatura,
 * congela o conteúdo com os placeholders resolvidos e grava a prova (nome,
 * e-mail, data, IP, user agent e hash). Um segundo envio devolve sucesso sem
 * sobrescrever a assinatura original.
 */
export async function signContractAction(input: {
  token: string
  firstname: string
  lastname?: string
  email: string
  signature: string
  consent: boolean
}): Promise<{ ok: true } | { error: string }> {
  const ip = await getClientIp()
  if (await isRateLimited(`contract:sign:${ip}`, 20, 600)) {
    return { error: "Muitas tentativas. Tente novamente em instantes." }
  }

  const admin = createAdminClient()
  const link = await resolveDocumentLink(admin, input.token)
  if (!link || link.rel_type !== "contract") return { error: INVALID }

  const { data: contractData } = await admin
    .from("contracts")
    .select(
      "id, tenant_id, company_id, title, content, content_rendered, value, start_date, end_date, signed_at, deleted_at",
    )
    .eq("id", link.rel_id)
    .eq("tenant_id", link.tenant_id)
    .is("deleted_at", null)
    .maybeSingle()
  const contract = contractData as ContractRow | null
  if (!contract) return { error: INVALID }
  if (contract.signed_at) return { ok: true }

  const parsed = signContractSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }

  const signature = decodeSignatureDataUrl(parsed.data.signature)
  if ("error" in signature) return { error: signature.error }

  const [{ data: tenantData }, { data: companyData }] = await Promise.all([
    admin
      .from("tenants")
      .select("name")
      .eq("id", contract.tenant_id)
      .maybeSingle(),
    contract.company_id
      ? admin
          .from("companies")
          .select("name, vat")
          .eq("id", contract.company_id)
          .eq("tenant_id", contract.tenant_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const { rendered, unresolved } = renderContractTemplate(
    contract.content_rendered ?? contract.content ?? "",
    contractVars({
      tenantName: (tenantData as { name?: string } | null)?.name ?? "",
      companyName: (companyData as { name?: string } | null)?.name ?? null,
      companyVat: (companyData as { vat?: string | null } | null)?.vat ?? null,
      value: contract.value === null ? null : Number(contract.value),
      currency: "BRL",
      startDate: contract.start_date,
      endDate: contract.end_date,
      today: todayIso(),
    }),
  )
  if (unresolved.length > 0) {
    logger.warn("contracts.signed_with_unresolved_fields", {
      contractId: contract.id,
      unresolved,
    })
  }

  const signaturePath = `${contract.tenant_id}/contracts/${contract.id}/signature-${randomUUID()}.png`
  const upload = await admin.storage
    .from(BUCKET)
    .upload(signaturePath, signature.bytes, {
      contentType: "image/png",
      upsert: false,
    })
  if (upload.error) {
    logger.error("contracts.signature_upload_failed", {
      contractId: contract.id,
      error: upload.error.message,
    })
    return { error: "Não foi possível salvar a assinatura. Tente novamente." }
  }

  const signedAt = new Date().toISOString()
  const userAgent = await readUserAgent()
  const { data: updated } = await admin
    .from("contracts")
    .update({
      signed_at: signedAt,
      signature_path: signaturePath,
      content_rendered: rendered,
      content_hash: hashContractContent(rendered),
      acceptance_firstname: parsed.data.firstname,
      acceptance_lastname: parsed.data.lastname ?? null,
      acceptance_email: parsed.data.email,
      acceptance_ip: ip,
      acceptance_user_agent: userAgent,
    })
    .eq("id", contract.id)
    .eq("tenant_id", contract.tenant_id)
    .is("signed_at", null)
    .select("id")

  if (!updated?.length) {
    // Outra requisição assinou primeiro: a assinatura dela vale, a nossa sobra.
    await admin.storage.from(BUCKET).remove([signaturePath])
    return { ok: true }
  }

  await admin.from("contract_signers").insert({
    tenant_id: contract.tenant_id,
    contract_id: contract.id,
    role: "client",
    name: [parsed.data.firstname, parsed.data.lastname]
      .filter(Boolean)
      .join(" "),
    email: parsed.data.email,
    signed_at: signedAt,
    signature_path: signaturePath,
    ip,
    user_agent: userAgent,
  })

  await admin.from("contract_events").insert({
    tenant_id: contract.tenant_id,
    contract_id: contract.id,
    kind: "signed",
    actor_kind: "client",
    ip,
    user_agent: userAgent,
    metadata: {
      email: parsed.data.email,
      name: parsed.data.firstname,
      hash: hashContractContent(rendered),
    },
  })

  await admin
    .from("document_links")
    .update({ responded_at: signedAt })
    .eq("id", link.id)

  return { ok: true }
}

/** User agent do navegador do signatário (prova complementar ao IP). */
async function readUserAgent(): Promise<string | null> {
  try {
    const { headers } = await import("next/headers")
    const headerList = await headers()
    return headerList.get("user-agent")
  } catch {
    return null
  }
}

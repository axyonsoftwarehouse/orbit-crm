"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth"
import { getActiveMembership } from "@/lib/tenant"
import { parseCsv } from "@/lib/csv"
import { checkPlanLimit } from "@/server/plan-limits"
import { logger } from "@/lib/logger"

export type ImportState =
  | {
      error?: string
      success?: string
      created?: number
      skipped?: number
      errors?: string[]
    }
  | undefined

type ColumnSpec = { key: string; aliases: string[] }

const MAX_BYTES = 2 * 1024 * 1024

function normalizeHeader(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

function mapRows(
  rows: string[][],
  columns: ColumnSpec[],
): Record<string, string>[] {
  if (rows.length === 0) return []

  const first = rows[0].map(normalizeHeader)
  const hasHeader = columns.some((column) =>
    [column.key, ...column.aliases]
      .map(normalizeHeader)
      .some((alias) => first.includes(alias)),
  )

  const indexByKey: Record<string, number> = {}
  let dataRows: string[][]

  if (hasHeader) {
    for (const column of columns) {
      const aliases = [column.key, ...column.aliases].map(normalizeHeader)
      indexByKey[column.key] = first.findIndex((value) =>
        aliases.includes(value),
      )
    }
    dataRows = rows.slice(1)
  } else {
    columns.forEach((column, index) => {
      indexByKey[column.key] = index
    })
    dataRows = rows
  }

  return dataRows.map((row) => {
    const record: Record<string, string> = {}
    for (const column of columns) {
      const index = indexByKey[column.key]
      record[column.key] = index >= 0 ? (row[index] ?? "").trim() : ""
    }
    return record
  })
}

async function readCsv(formData: FormData) {
  const file = formData.get("file")
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Selecione um arquivo CSV." as string, rows: null }
  }
  if (file.size > MAX_BYTES) {
    return { error: "Arquivo muito grande (máximo 2 MB).", rows: null }
  }
  const text = await file.text()
  return { error: null, rows: parseCsv(text) }
}

const COMPANY_COLUMNS: ColumnSpec[] = [
  { key: "name", aliases: ["nome", "cliente", "empresa"] },
  { key: "phone", aliases: ["telefone", "celular"] },
  { key: "website", aliases: ["site", "url"] },
  { key: "city", aliases: ["cidade"] },
  { key: "country", aliases: ["pais", "country"] },
]

export async function importCompaniesAction(
  _prevState: ImportState,
  formData: FormData,
): Promise<ImportState> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }

  const limit = await checkPlanLimit(active.tenantId, "clients")
  if (!limit.ok) return { error: limit.message ?? "Limite do plano atingido." }
  const remaining = limit.remaining

  const { error: readError, rows } = await readCsv(formData)
  if (readError || !rows)
    return { error: readError ?? "Falha ao ler o arquivo." }

  const records = mapRows(rows, COMPANY_COLUMNS).filter(
    (record) => record.name !== "",
  )
  if (records.length === 0) {
    return { error: "Nenhuma linha com 'Nome' encontrada." }
  }

  const supabase = await createClient()
  const { data: existing } = await supabase
    .from("companies")
    .select("name")
    .eq("tenant_id", active.tenantId)
    .is("deleted_at", null)
  const existingNames = new Set(
    (existing ?? []).map((row) => (row.name ?? "").toLowerCase()),
  )

  const user = await getUser()
  let created = 0
  let skipped = 0
  const errors: string[] = []
  const seen = new Set<string>()

  for (const record of records) {
    if (remaining !== undefined && created >= remaining) {
      errors.push("Limite do plano atingido; importação interrompida.")
      break
    }
    const name = record.name
    const key = name.toLowerCase()
    if (existingNames.has(key) || seen.has(key)) {
      skipped++
      continue
    }
    seen.add(key)

    const { error } = await supabase.from("companies").insert({
      tenant_id: active.tenantId,
      created_by: user?.id ?? null,
      name,
      phone: record.phone || null,
      website: record.website || null,
      city: record.city || null,
      country: record.country || null,
    })
    if (error) {
      logger.error("import.companies.row_failed", { error: error.message })
      errors.push(`${name}: não foi possível importar`)
      continue
    }
    created++
  }

  revalidatePath("/app/clientes")
  return {
    success: `Importação concluída: ${created} criado(s), ${skipped} ignorado(s).`,
    created,
    skipped,
    errors,
  }
}

const LEAD_COLUMNS: ColumnSpec[] = [
  { key: "name", aliases: ["nome", "lead"] },
  { key: "company", aliases: ["empresa"] },
  { key: "email", aliases: ["e-mail"] },
  { key: "value", aliases: ["valor"] },
]

export async function importLeadsAction(
  _prevState: ImportState,
  formData: FormData,
): Promise<ImportState> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }

  const limit = await checkPlanLimit(active.tenantId, "leads")
  if (!limit.ok) return { error: limit.message ?? "Limite do plano atingido." }
  const remaining = limit.remaining

  const { error: readError, rows } = await readCsv(formData)
  if (readError || !rows)
    return { error: readError ?? "Falha ao ler o arquivo." }

  const records = mapRows(rows, LEAD_COLUMNS).filter(
    (record) => record.name !== "",
  )
  if (records.length === 0) {
    return { error: "Nenhuma linha com 'Nome' encontrada." }
  }

  const supabase = await createClient()
  const { data: existing } = await supabase
    .from("leads")
    .select("name, email")
    .eq("tenant_id", active.tenantId)
    .is("deleted_at", null)
  const existingKeys = new Set(
    (existing ?? []).map((row) => (row.email || row.name || "").toLowerCase()),
  )

  const user = await getUser()
  let created = 0
  let skipped = 0
  const errors: string[] = []
  const seen = new Set<string>()

  for (const record of records) {
    if (remaining !== undefined && created >= remaining) {
      errors.push("Limite do plano atingido; importação interrompida.")
      break
    }
    const key = (record.email || record.name).toLowerCase()
    if (existingKeys.has(key) || seen.has(key)) {
      skipped++
      continue
    }
    seen.add(key)

    const value = record.value ? Number(record.value.replace(",", ".")) : null

    const { error } = await supabase.from("leads").insert({
      tenant_id: active.tenantId,
      created_by: user?.id ?? null,
      name: record.name,
      company: record.company || null,
      email: record.email || null,
      value: value !== null && Number.isFinite(value) ? value : null,
    })
    if (error) {
      logger.error("import.leads.row_failed", { error: error.message })
      errors.push(`${record.name}: não foi possível importar`)
      continue
    }
    created++
  }

  revalidatePath("/app/leads")
  return {
    success: `Importação concluída: ${created} criado(s), ${skipped} ignorado(s).`,
    created,
    skipped,
    errors,
  }
}

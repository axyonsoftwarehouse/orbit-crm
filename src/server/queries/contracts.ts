import { createClient } from "@/lib/supabase/server"

export type Contract = {
  id: string
  title: string
  description: string | null
  content: string | null
  content_hash: string | null
  value: number | null
  start_date: string | null
  end_date: string | null
  status: number
  company_id: string | null
  note: string | null
  signed_at: string | null
  marked_as_signed_at: string | null
  last_sent_at: string | null
}

export type ContractListRow = Contract & {
  company: { id: string; name: string } | null
}

export type ContractEvent = {
  id: string
  kind: string
  actor_kind: string
  actor_id: string | null
  ip: string | null
  created_at: string
  metadata: Record<string, unknown> | null
}

const CONTRACT_COLUMNS =
  "id, title, description, content, content_hash, value, start_date, end_date, status, company_id, note, signed_at, marked_as_signed_at, last_sent_at, company:companies(id, name)"

export type ContractFilters = {
  companyId?: string
  status?: string
}

export async function listContracts(
  tenantId: string,
  filters: ContractFilters = {},
): Promise<ContractListRow[]> {
  const supabase = await createClient()
  let query = supabase
    .from("contracts")
    .select(CONTRACT_COLUMNS)
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)

  if (filters.companyId) query = query.eq("company_id", filters.companyId)
  if (filters.status) query = query.eq("status", Number(filters.status))

  const { data } = await query.order("created_at", { ascending: false })
  return (data ?? []) as unknown as ContractListRow[]
}

export async function listContractsPage(
  tenantId: string,
  filters: ContractFilters & { page: number; pageSize: number },
): Promise<{ rows: ContractListRow[]; total: number }> {
  const supabase = await createClient()
  let query = supabase
    .from("contracts")
    .select(CONTRACT_COLUMNS, { count: "exact" })
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)

  if (filters.companyId) query = query.eq("company_id", filters.companyId)
  if (filters.status) query = query.eq("status", Number(filters.status))

  const from = (filters.page - 1) * filters.pageSize
  const { data, count } = await query
    .order("created_at", { ascending: false })
    .range(from, from + filters.pageSize - 1)

  return {
    rows: (data ?? []) as unknown as ContractListRow[],
    total: count ?? 0,
  }
}

export async function getContract(
  tenantId: string,
  id: string,
): Promise<ContractListRow | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("contracts")
    .select(CONTRACT_COLUMNS)
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .maybeSingle()
  return (data as unknown as ContractListRow | null) ?? null
}

export async function listContractEvents(
  tenantId: string,
  contractId: string,
): Promise<ContractEvent[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("contract_events")
    .select("id, kind, actor_kind, actor_id, ip, created_at, metadata")
    .eq("tenant_id", tenantId)
    .eq("contract_id", contractId)
    .order("created_at", { ascending: false })
    .limit(50)

  return (data ?? []) as ContractEvent[]
}

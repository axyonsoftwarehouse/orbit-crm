import { createClient } from "@/lib/supabase/server"

export type Item = {
  id: string
  group_id: string | null
  description: string
  long_description: string | null
  rate: number
  purchase_price: number | null
  unit: string | null
  tax_name: string | null
  tax_rate: number | null
  active: boolean
}

export type ItemOption = {
  id: string
  description: string
  long_description: string | null
  rate: number
  unit: string | null
  tax_name: string | null
  tax_rate: number | null
  active: boolean
  group: { id: string; name: string } | null
}

export type ItemListRow = ItemOption

export type ItemGroupOption = { id: string; name: string; count: number }

export type ItemFilters = {
  search?: string
  groupId?: string
  status?: "active" | "inactive" | "all"
}

const ITEM_COLUMNS =
  "id, group_id, description, long_description, rate, purchase_price, unit, tax_name, tax_rate, active, group:item_groups(id, name)"

const OPTION_COLUMNS =
  "id, description, long_description, rate, unit, tax_name, tax_rate, active, group:item_groups(id, name)"

export async function listItemsPage(
  tenantId: string,
  filters: ItemFilters & { page: number; pageSize: number },
): Promise<{ rows: ItemListRow[]; total: number }> {
  const supabase = await createClient()
  let query = supabase
    .from("items")
    .select(ITEM_COLUMNS, { count: "exact" })
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)

  const status = filters.status ?? "active"
  if (status === "active") query = query.eq("active", true)
  if (status === "inactive") query = query.eq("active", false)
  if (filters.search) query = query.ilike("description", `%${filters.search}%`)
  if (filters.groupId) query = query.eq("group_id", filters.groupId)

  const from = (filters.page - 1) * filters.pageSize
  const { data, count } = await query
    .order("description")
    .range(from, from + filters.pageSize - 1)

  return {
    rows: (data ?? []) as unknown as ItemListRow[],
    total: count ?? 0,
  }
}

export async function listItemOptions(tenantId: string): Promise<ItemOption[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("items")
    .select(OPTION_COLUMNS)
    .eq("tenant_id", tenantId)
    .eq("active", true)
    .is("deleted_at", null)
    .order("description")
  return (data ?? []) as unknown as ItemOption[]
}

export async function listItemGroups(
  tenantId: string,
): Promise<ItemGroupOption[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("item_groups")
    .select("id, name, items(count)")
    .eq("tenant_id", tenantId)
    .order("name")

  const rows = (data ?? []) as unknown as {
    id: string
    name: string
    items: { count: number }[] | null
  }[]

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    count: row.items?.[0]?.count ?? 0,
  }))
}

export async function listItemDescriptions(tenantId: string): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("items")
    .select("description")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
  return ((data ?? []) as { description: string }[]).map(
    (row) => row.description,
  )
}

export async function getItem(
  tenantId: string,
  id: string,
): Promise<Item | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("items")
    .select("*")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .maybeSingle()
  return (data as Item | null) ?? null
}

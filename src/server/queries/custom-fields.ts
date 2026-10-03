import { createClient } from "@/lib/supabase/server"
import type { CustomFieldEntity } from "@/lib/constants"

export type CustomFieldDefinition = {
  id: string
  entity_type: CustomFieldEntity
  label: string
  key: string
  field_type: string
  required: boolean
  position: number
  options: string[]
  is_active: boolean
}

const DEFINITION_COLUMNS =
  "id, entity_type, label, key, field_type, required, position, options, is_active"

export async function listCustomFieldDefinitions(
  tenantId: string,
  entityType: CustomFieldEntity,
): Promise<CustomFieldDefinition[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("custom_field_definitions")
    .select(DEFINITION_COLUMNS)
    .eq("tenant_id", tenantId)
    .eq("entity_type", entityType)
    .eq("is_active", true)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true })

  return (data ?? []) as CustomFieldDefinition[]
}

export async function listCustomFieldDefinitionsAll(
  tenantId: string,
): Promise<CustomFieldDefinition[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("custom_field_definitions")
    .select(DEFINITION_COLUMNS)
    .eq("tenant_id", tenantId)
    .order("entity_type", { ascending: true })
    .order("position", { ascending: true })
    .order("created_at", { ascending: true })

  return (data ?? []) as CustomFieldDefinition[]
}

export async function customFieldValuesForEntity(
  tenantId: string,
  entityType: CustomFieldEntity,
  entityId: string,
): Promise<Record<string, string>> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("custom_field_values")
    .select("field_id, value")
    .eq("tenant_id", tenantId)
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)

  const map: Record<string, string> = {}
  for (const row of (data ?? []) as {
    field_id: string
    value: string | null
  }[]) {
    if (row.value !== null) map[row.field_id] = row.value
  }
  return map
}

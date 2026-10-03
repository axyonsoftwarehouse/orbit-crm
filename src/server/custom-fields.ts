import type { SupabaseClient } from "@supabase/supabase-js"
import type { CustomFieldEntity } from "@/lib/constants"

type DefinitionRow = {
  id: string
  key: string
  field_type: string
}

export async function saveCustomFieldValues(
  supabase: SupabaseClient,
  tenantId: string,
  entityType: CustomFieldEntity,
  entityId: string,
  formData: FormData,
) {
  const { data: definitions } = await supabase
    .from("custom_field_definitions")
    .select("id, key, field_type")
    .eq("tenant_id", tenantId)
    .eq("entity_type", entityType)
    .eq("is_active", true)

  for (const definition of (definitions ?? []) as DefinitionRow[]) {
    const raw = formData.get(`cf_${definition.key}`)

    let value: string | null
    if (definition.field_type === "checkbox") {
      value = raw === "on" || raw === "true" ? "true" : "false"
    } else {
      const text = typeof raw === "string" ? raw.trim() : ""
      value = text.length > 0 ? text : null
    }

    if (value === null) {
      await supabase
        .from("custom_field_values")
        .delete()
        .eq("tenant_id", tenantId)
        .eq("field_id", definition.id)
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
    } else {
      await supabase.from("custom_field_values").upsert(
        {
          tenant_id: tenantId,
          field_id: definition.id,
          entity_type: entityType,
          entity_id: entityId,
          value,
        },
        { onConflict: "field_id,entity_type,entity_id" },
      )
    }
  }
}

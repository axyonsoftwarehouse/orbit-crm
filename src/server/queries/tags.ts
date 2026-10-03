import { createClient } from "@/lib/supabase/server"

export type Tag = {
  id: string
  name: string
  color: string
}

export type TaggedEntityType =
  "company" | "project" | "task" | "lead" | "ticket"

export async function listTags(tenantId: string): Promise<Tag[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("tags")
    .select("id, name, color")
    .eq("tenant_id", tenantId)
    .order("name", { ascending: true })

  return (data ?? []) as Tag[]
}

export async function tagsForEntity(
  tenantId: string,
  entityType: TaggedEntityType,
  entityId: string,
): Promise<Tag[]> {
  const supabase = await createClient()
  const { data: rows } = await supabase
    .from("taggables")
    .select("tag_id")
    .eq("tenant_id", tenantId)
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)

  const tagIds = ((rows ?? []) as { tag_id: string }[]).map((row) => row.tag_id)
  if (tagIds.length === 0) return []

  const { data } = await supabase
    .from("tags")
    .select("id, name, color")
    .in("id", tagIds)
    .order("name", { ascending: true })

  return (data ?? []) as Tag[]
}

export async function entityIdsByTag(
  tenantId: string,
  entityType: TaggedEntityType,
  tagId: string,
): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("taggables")
    .select("entity_id")
    .eq("tenant_id", tenantId)
    .eq("entity_type", entityType)
    .eq("tag_id", tagId)

  return ((data ?? []) as { entity_id: string }[]).map((row) => row.entity_id)
}

/** Tabela de cada entidade que aceita anexos (`attachments.entity_type`). */
export const ATTACHMENT_ENTITY_TABLES: Record<
  string,
  "tasks" | "projects" | "tickets"
> = {
  task: "tasks",
  project: "projects",
  ticket: "tickets",
}

export const SOCIAL_IMAGE_MAX_BYTES = 10 * 1024 * 1024

export function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120)
}

/**
 * Caminho de um objeto no Storage: `<tenant>/<pasta>/<uuid>-<nome>`. O
 * primeiro segmento é o tenant, que as policies de `storage.objects` usam.
 */
export function storageObjectPath(
  tenantId: string,
  folder: string,
  fileName: string,
): string {
  return `${tenantId}/${folder}/${crypto.randomUUID()}-${sanitizeFileName(fileName)}`
}

/** Pasta esperada de um anexo, para conferir o caminho no registro. */
export function attachmentFolder(
  tenantId: string,
  entityType: string,
  entityId: string,
): string {
  return `${tenantId}/${entityType}/${entityId}/`
}

/** Pasta esperada de uma mídia do Social, para conferir o caminho no registro. */
export function socialMediaFolder(tenantId: string, postId: string): string {
  return `${tenantId}/social/${postId}/`
}

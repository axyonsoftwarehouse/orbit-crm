import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText } from "lucide-react"
import { listAttachments } from "@/server/queries/attachments"
import { AttachmentUploader } from "./attachment-uploader"
import { DeleteAttachmentButton } from "./delete-attachment-button"

function humanSize(bytes: number | null) {
  if (!bytes) return ""
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export async function AttachmentsSection({
  tenantId,
  entityType,
  entityId,
}: {
  tenantId: string
  entityType: "task" | "project"
  entityId: string
}) {
  const attachments = await listAttachments(tenantId, entityType, entityId)

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-base">Anexos</CardTitle>
        <AttachmentUploader
          tenantId={tenantId}
          entityType={entityType}
          entityId={entityId}
        />
      </CardHeader>
      <CardContent className="space-y-2">
        {attachments.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhum anexo ainda.</p>
        ) : (
          attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
            >
              <a
                href={attachment.url ?? "#"}
                target="_blank"
                rel="noreferrer"
                className="flex min-w-0 items-center gap-2 text-sm hover:underline"
              >
                <FileText className="text-muted-foreground size-4 shrink-0" />
                <span className="truncate">{attachment.file_name}</span>
              </a>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-muted-foreground text-xs">
                  {humanSize(attachment.size_bytes)}
                </span>
                <DeleteAttachmentButton
                  id={attachment.id}
                  storagePath={attachment.storage_path}
                  entityType={entityType}
                  entityId={entityId}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

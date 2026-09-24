"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Paperclip } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { registerAttachmentAction } from "@/server/actions/attachments"

function sanitize(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120)
}

export function AttachmentUploader({
  tenantId,
  entityType,
  entityId,
}: {
  tenantId: string
  entityType: string
  entityId: string
}) {
  const [isUploading, setIsUploading] = useState(false)
  const router = useRouter()

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const supabase = createClient()
      const path = `${tenantId}/${entityType}/${entityId}/${crypto.randomUUID()}-${sanitize(file.name)}`

      const { error: uploadError } = await supabase.storage
        .from("attachments")
        .upload(path, file, {
          contentType: file.type || "application/octet-stream",
          upsert: false,
        })
      if (uploadError) throw uploadError

      const result = await registerAttachmentAction({
        entityType,
        entityId,
        storagePath: path,
        fileName: file.name,
        mimeType: file.type || null,
        sizeBytes: file.size,
      })
      if (result?.error) throw new Error(result.error)

      toast.success("Anexo enviado.")
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Falha ao enviar o anexo.",
      )
    } finally {
      setIsUploading(false)
      event.target.value = ""
    }
  }

  return (
    <label className="hover:bg-accent inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium">
      <Paperclip className="size-3.5" />
      {isUploading ? "Enviando..." : "Anexar"}
      <input
        type="file"
        className="hidden"
        disabled={isUploading}
        onChange={handleChange}
      />
    </label>
  )
}

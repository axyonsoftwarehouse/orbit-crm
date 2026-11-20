"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Paperclip } from "lucide-react"
import { uploadWithSignedUrl } from "@/lib/upload-client"
import { registerAttachmentAction } from "@/server/actions/attachments"
import { UserFacingError, userMessage } from "@/lib/errors"

export function AttachmentUploader({
  entityType,
  entityId,
}: {
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
      const path = await uploadWithSignedUrl(
        { kind: "attachment", entityType, entityId },
        file,
      )

      const result = await registerAttachmentAction({
        entityType,
        entityId,
        storagePath: path,
        fileName: file.name,
        mimeType: file.type || null,
        sizeBytes: file.size,
      })
      if (result?.error) throw new UserFacingError(result.error)

      toast.success("Anexo enviado.")
      router.refresh()
    } catch (error) {
      toast.error(
        userMessage(error, "Não foi possível enviar o anexo. Tente novamente."),
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

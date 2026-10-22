"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ImagePlus } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { registerSocialMediaAction } from "@/server/actions/social"

function sanitize(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100)
}

export function SocialMediaUploader({
  tenantId,
  postId,
}: {
  tenantId: string
  postId: string
}) {
  const [isUploading, setIsUploading] = useState(false)
  const router = useRouter()

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Envie apenas imagens.")
      event.target.value = ""
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 10 MB.")
      event.target.value = ""
      return
    }

    setIsUploading(true)
    try {
      const supabase = createClient()
      const path = `${tenantId}/social/${postId}/${crypto.randomUUID()}-${sanitize(file.name)}`

      const { error: uploadError } = await supabase.storage
        .from("social_media")
        .upload(path, file, {
          contentType: file.type,
          upsert: false,
        })
      if (uploadError) throw uploadError

      const result = await registerSocialMediaAction({
        postId,
        storagePath: path,
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
      })
      if (result?.error) throw new Error(result.error)

      toast.success("Imagem enviada.")
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Falha ao enviar a imagem.",
      )
    } finally {
      setIsUploading(false)
      event.target.value = ""
    }
  }

  return (
    <label className="hover:bg-accent inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium">
      <ImagePlus className="size-3.5" />
      {isUploading ? "Enviando..." : "Adicionar imagem"}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        disabled={isUploading}
        onChange={handleChange}
      />
    </label>
  )
}

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ImagePlus } from "lucide-react"
import { uploadWithSignedUrl } from "@/lib/upload-client"
import { SOCIAL_IMAGE_MAX_BYTES } from "@/lib/storage-paths"
import { registerSocialMediaAction } from "@/server/actions/social"

export function SocialMediaUploader({ postId }: { postId: string }) {
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
    if (file.size > SOCIAL_IMAGE_MAX_BYTES) {
      toast.error("A imagem deve ter no máximo 10 MB.")
      event.target.value = ""
      return
    }

    setIsUploading(true)
    try {
      const path = await uploadWithSignedUrl(
        { kind: "social_media", postId },
        file,
      )

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

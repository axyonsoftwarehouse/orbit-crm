import { z } from "zod"

const siteUrl = z.preprocess((value) => {
  if (typeof value !== "string") return value
  const trimmed = value.trim()
  if (!trimmed) return trimmed
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}, z.string().url("Informe uma URL válida").max(2048))

export const seoSiteSchema = z.object({
  label: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((value) => value || undefined),
  url: siteUrl,
  company_id: z.string().uuid().optional(),
})

export type SeoSiteInput = z.infer<typeof seoSiteSchema>

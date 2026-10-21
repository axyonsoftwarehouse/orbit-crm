import { z } from "zod"
import { SEO_CHECK_INTERVALS } from "@/lib/constants"

const siteUrl = z.preprocess((value) => {
  if (typeof value !== "string") return value
  const trimmed = value.trim()
  if (!trimmed) return trimmed
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}, z.string().url("Informe uma URL válida").max(2048))

const checkInterval = z.coerce
  .number()
  .int()
  .refine(
    (value) =>
      SEO_CHECK_INTERVALS.includes(
        value as (typeof SEO_CHECK_INTERVALS)[number],
      ),
    "Intervalo de monitoramento inválido.",
  )

export const seoSiteSchema = z.object({
  label: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((value) => value || undefined),
  url: siteUrl,
  company_id: z.string().uuid().optional(),
  check_interval_days: checkInterval.default(0),
})

export const seoMonitoringSchema = z.object({
  check_interval_days: checkInterval,
})

export type SeoSiteInput = z.infer<typeof seoSiteSchema>

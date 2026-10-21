import { z } from "zod"

export const SOCIAL_PROVIDER_VALUES = [
  "linkedin",
  "instagram",
  "facebook",
  "x",
  "tiktok",
  "threads",
  "youtube",
  "pinterest",
] as const

export const socialAccountSchema = z.object({
  provider: z.enum(SOCIAL_PROVIDER_VALUES),
  provider_account_id: z.string().trim().min(1).max(200),
  display_name: z.string().trim().min(1, "Informe o nome da conta").max(160),
  company_id: z.string().uuid().optional(),
})

export type SocialAccountInput = z.infer<typeof socialAccountSchema>

export const socialPostSchema = z.object({
  company_id: z.string().uuid("Selecione um cliente"),
  content: z
    .string()
    .trim()
    .min(1, "Escreva o conteúdo do post")
    .max(5000, "O post deve ter no máximo 5.000 caracteres"),
  target_ids: z
    .array(z.string().uuid())
    .min(1, "Selecione pelo menos uma conta"),
  requires_approval: z.boolean().default(true),
})

export type SocialPostInput = z.infer<typeof socialPostSchema>

export const socialScheduleSchema = z.object({
  scheduled_at: z.string().trim().min(1, "Informe a data e hora"),
})

export const socialPostResponseSchema = z.object({
  post_id: z.string().uuid(),
  approve: z.boolean(),
  note: z.string().trim().max(1000).optional(),
})

export type SocialPostResponseInput = z.infer<typeof socialPostResponseSchema>

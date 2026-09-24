import { z } from "zod"
import {
  optionalLongText,
  optionalNumber,
  optionalText,
} from "@/lib/validations/fields"

export const leadSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome").max(191),
  company: optionalText,
  title: optionalText,
  email: z
    .union([z.string().trim().email("E-mail inválido"), z.literal("")])
    .optional()
    .transform((value) => (value ? value : undefined)),
  phone: optionalText,
  website: optionalText,
  description: optionalLongText,
  status_id: z.string().uuid().optional(),
  source_id: z.string().uuid().optional(),
  value: optionalNumber(),
  assignee_id: z.string().uuid().optional(),
  city: optionalText,
  state: optionalText,
  country: optionalText,
})

export type LeadInput = z.infer<typeof leadSchema>

export const leadStatusSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome").max(50),
  color: optionalText,
  is_won: z.boolean().default(false),
  is_lost: z.boolean().default(false),
})

export const leadSourceSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome").max(150),
})

export const leadActivitySchema = z.object({
  description: z.string().trim().min(1, "Escreva algo").max(2000),
})

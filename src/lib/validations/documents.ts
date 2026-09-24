import { z } from "zod"
import {
  optionalDate,
  optionalLongText,
  optionalNumber,
  optionalText,
} from "@/lib/validations/fields"

export const lineItemSchema = z.object({
  description: z.string().trim().min(1, "Descreva o item").max(500),
  qty: z.coerce.number().min(0).default(1),
  rate: z.coerce.number().default(0),
  unit: optionalText,
  tax_name: optionalText,
  tax_rate: optionalNumber(),
})

export const documentSchema = z.object({
  company_id: z.string().uuid().optional(),
  project_id: z.string().uuid().optional(),
  date: z.string().min(1, "Informe a data"),
  due_date: optionalDate,
  expiry_date: optionalDate,
  currency: z.string().trim().min(1).max(3).default("BRL"),
  discount_type: z.enum(["before_tax", "after_tax"]).default("before_tax"),
  discount_percent: optionalNumber(),
  discount_total: optionalNumber(),
  adjustment: optionalNumber(),
  reference_no: optionalText,
  client_note: optionalLongText,
  terms: optionalLongText,
  items: z.array(lineItemSchema).min(1, "Adicione ao menos um item"),
})

export type DocumentInput = z.infer<typeof documentSchema>

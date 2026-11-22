import { z } from "zod"
import {
  optionalLongText,
  optionalNumber,
  optionalText,
} from "@/lib/validations/fields"

const optionalUuid = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.string().uuid().optional(),
)

const optionalUnit = z
  .string()
  .trim()
  .max(50)
  .optional()
  .transform((value) => (value ? value : undefined))

const optionalTaxRate = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) return undefined
  const parsed = Number(value)
  return Number.isNaN(parsed) ? undefined : parsed
}, z.number().min(0).max(100).optional())

export const itemGroupSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do grupo.").max(100),
})

export const itemSchema = z
  .object({
    description: z.string().trim().min(1, "Descreva o item").max(200),
    long_description: optionalLongText,
    group_id: optionalUuid,
    rate: z.coerce.number().min(0, "Informe um valor válido."),
    purchase_price: optionalNumber(),
    unit: optionalUnit,
    tax_name: optionalText,
    tax_rate: optionalTaxRate,
    active: z.boolean().default(true),
  })
  .refine(
    (data) =>
      (!data.tax_name && data.tax_rate === undefined) ||
      (Boolean(data.tax_name) && data.tax_rate !== undefined),
    {
      message: "Informe o nome e a alíquota do imposto juntos.",
      path: ["tax_rate"],
    },
  )

export const importItemRowSchema = z
  .object({
    description: z.string().trim().min(1).max(200),
    long_description: z.string().trim().max(5000).nullish(),
    group: z.string().trim().max(100).nullish(),
    rate: z.number().min(0),
    unit: z.string().trim().max(50).nullish(),
    tax_name: z.string().trim().max(100).nullish(),
    tax_rate: z.number().min(0).max(100).nullish(),
  })
  .refine(
    (data) =>
      (!data.tax_name && (data.tax_rate === null || data.tax_rate === undefined)) ||
      (Boolean(data.tax_name) &&
        data.tax_rate !== null &&
        data.tax_rate !== undefined),
    { message: "Informe o nome e a alíquota do imposto juntos." },
  )

export type ItemInput = z.infer<typeof itemSchema>
export type ImportItemRowInput = z.infer<typeof importItemRowSchema>

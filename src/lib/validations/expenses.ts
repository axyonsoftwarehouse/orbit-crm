import { z } from "zod"
import { optionalLongText } from "@/lib/validations/fields"

const optionalText = z
  .string()
  .trim()
  .max(80)
  .optional()
  .transform((value) => (value ? value : undefined))

export const expenseSchema = z.object({
  title: z.string().trim().min(1, "Informe a descrição").max(200),
  category: optionalText,
  amount: z.coerce.number().min(0, "Valor inválido"),
  date: z.string().trim().min(1, "Informe a data"),
  project_id: z.string().uuid().optional(),
  company_id: z.string().uuid().optional(),
  billable: z.boolean().default(false),
  note: optionalLongText,
})

export type ExpenseInput = z.infer<typeof expenseSchema>

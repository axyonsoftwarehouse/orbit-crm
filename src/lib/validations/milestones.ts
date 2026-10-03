import { z } from "zod"
import { optionalDate, optionalLongText } from "@/lib/validations/fields"

export const milestoneSchema = z.object({
  project_id: z.string().uuid("Selecione um projeto"),
  name: z.string().trim().min(1, "Informe o nome do marco").max(200),
  description: optionalLongText,
  status: z.coerce.number().int().min(1).max(3).default(1),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida")
    .default("#0062FF"),
  start_date: optionalDate,
  due_date: optionalDate,
})

export type MilestoneInput = z.infer<typeof milestoneSchema>

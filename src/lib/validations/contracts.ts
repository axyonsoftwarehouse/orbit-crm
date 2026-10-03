import { z } from "zod"
import {
  optionalDate,
  optionalLongText,
  optionalNumber,
} from "@/lib/validations/fields"

export const contractSchema = z.object({
  title: z.string().trim().min(1, "Informe o título").max(200),
  company_id: z.string().uuid().optional(),
  description: optionalLongText,
  value: optionalNumber(),
  start_date: optionalDate,
  end_date: optionalDate,
  status: z.coerce.number().int().min(1).max(3).default(1),
  note: optionalLongText,
})

export type ContractInput = z.infer<typeof contractSchema>

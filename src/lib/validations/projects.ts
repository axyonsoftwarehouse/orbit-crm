import { z } from "zod"
import {
  optionalDate,
  optionalLongText,
  optionalNumber,
} from "@/lib/validations/fields"

export const projectSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do projeto").max(200),
  company_id: z.string().uuid().optional(),
  description: optionalLongText,
  status: z.coerce.number().int().min(1).max(5).default(1),
  billing_type: z.coerce.number().int().min(1).max(3).default(1),
  start_date: optionalDate,
  deadline: optionalDate,
  progress: z.coerce.number().int().min(0).max(100).default(0),
  progress_from_tasks: z.boolean().default(false),
  project_cost: optionalNumber(),
  rate_per_hour: optionalNumber(),
  estimated_hours: optionalNumber(),
})

export type ProjectInput = z.infer<typeof projectSchema>

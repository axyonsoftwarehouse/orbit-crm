import { z } from "zod"
import {
  optionalDate,
  optionalLongText,
  optionalNumber,
} from "@/lib/validations/fields"

export const taskSchema = z.object({
  project_id: z.string().uuid("Selecione um projeto"),
  name: z.string().trim().min(1, "Informe o título da tarefa").max(200),
  description: optionalLongText,
  status: z.coerce.number().int().min(1).max(5).default(1),
  priority: z.coerce.number().int().min(1).max(4).default(2),
  start_date: optionalDate,
  due_date: optionalDate,
  assignee_id: z.string().uuid().optional(),
  milestone_id: z.string().uuid().optional(),
  billable: z.boolean().default(false),
  hourly_rate: optionalNumber(),
})

export type TaskInput = z.infer<typeof taskSchema>

export const checklistItemSchema = z.object({
  title: z.string().trim().min(1, "Informe o item").max(500),
})

export type ChecklistItemInput = z.infer<typeof checklistItemSchema>

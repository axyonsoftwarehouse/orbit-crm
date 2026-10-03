import { z } from "zod"
import { optionalLongText } from "@/lib/validations/fields"

export const calendarEventSchema = z.object({
  title: z.string().trim().min(1, "Informe o título").max(200),
  description: optionalLongText,
  start_at: z.string().trim().min(1, "Informe o início"),
  end_at: z.string().trim().optional(),
  company_id: z.string().uuid().optional(),
  project_id: z.string().uuid().optional(),
})

export type CalendarEventInput = z.infer<typeof calendarEventSchema>

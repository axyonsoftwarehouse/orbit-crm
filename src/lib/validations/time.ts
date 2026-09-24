import { z } from "zod"
import { optionalNumber, optionalText } from "@/lib/validations/fields"

export const manualEntrySchema = z.object({
  project_id: z.string().uuid("Selecione um projeto"),
  task_id: z.string().uuid().optional(),
  date: z.string().min(1, "Informe a data"),
  hours: z.coerce
    .number()
    .positive("Informe as horas")
    .max(24, "Máximo de 24 horas por lançamento"),
  note: optionalText,
  is_billable: z.boolean().default(false),
  rate: optionalNumber(),
})

export type ManualEntryInput = z.infer<typeof manualEntrySchema>

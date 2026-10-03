import { z } from "zod"

export const goalSchema = z
  .object({
    title: z
      .string()
      .trim()
      .max(120)
      .optional()
      .transform((value) => (value ? value : undefined)),
    metric: z.enum(["revenue", "leads", "hours"]),
    period_start: z.string().trim().min(1, "Informe o início"),
    period_end: z.string().trim().min(1, "Informe o fim"),
    target: z.coerce.number().min(0, "Valor inválido"),
  })
  .refine((data) => data.period_end >= data.period_start, {
    message: "O fim deve ser posterior ao início",
    path: ["period_end"],
  })

export type GoalInput = z.infer<typeof goalSchema>

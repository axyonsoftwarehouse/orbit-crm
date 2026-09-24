import { z } from "zod"
import { optionalLongText } from "@/lib/validations/fields"

const limitField = z.preprocess(
  (value) =>
    value === "" || value === null || value === undefined
      ? null
      : Number(value),
  z.number().int().min(0).nullable(),
)

export const planSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome").max(120),
  description: optionalLongText,
  price: z.coerce.number().min(0).default(0),
  interval: z.enum(["monthly", "yearly"]).default("monthly"),
  trial_days: z.coerce.number().int().min(0).default(0),
  most_popular: z.boolean().default(false),
  limits: z.object({
    clients: limitField,
    projects: limitField,
    tasks: limitField,
    tickets: limitField,
    leads: limitField,
  }),
})

export type PlanInput = z.infer<typeof planSchema>

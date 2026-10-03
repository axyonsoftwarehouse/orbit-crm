import { z } from "zod"

export const publicLeadSchema = z.object({
  name: z.string().trim().min(1, "Informe seu nome").max(200),
  email: z
    .union([
      z.string().trim().toLowerCase().email("E-mail inválido"),
      z.literal(""),
    ])
    .optional(),
  phone: z.string().trim().max(40).optional(),
  message: z.string().trim().max(2000).optional(),
})

export type PublicLeadInput = z.infer<typeof publicLeadSchema>

import { z } from "zod"

export const signInSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter ao menos 6 caracteres"),
})

export type SignInInput = z.infer<typeof signInSchema>

export const createTenantSchema = z.object({
  name: z.string().min(2, "Informe o nome da empresa"),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e hífen")
    .optional(),
})

export type CreateTenantInput = z.infer<typeof createTenantSchema>

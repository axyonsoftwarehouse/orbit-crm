import { z } from "zod"

export const signInSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter ao menos 6 caracteres"),
})

export type SignInInput = z.infer<typeof signInSchema>

export const emailSchema = z.string().trim().toLowerCase().email()

/** Nova senha com confirmação (convite do portal e redefinição). */
export const newPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "A senha deve ter ao menos 8 caracteres")
      .max(72, "A senha deve ter no máximo 72 caracteres"),
    confirm: z.string(),
  })
  .refine((value) => value.password === value.confirm, {
    message: "As senhas não conferem.",
    path: ["confirm"],
  })

/** Área de onde veio o pedido: decide o link e para onde voltar. */
export type AuthArea = "app" | "portal"

export function parseArea(value: unknown): AuthArea {
  return value === "portal" ? "portal" : "app"
}

export const createTenantSchema = z.object({
  name: z.string().min(2, "Informe o nome da empresa"),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e hífen")
    .optional(),
})

export type CreateTenantInput = z.infer<typeof createTenantSchema>

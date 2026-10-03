import { z } from "zod"

export const inviteMemberSchema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  role: z.enum(["admin", "member"]).default("member"),
})

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>

export const acceptInvitationSchema = z.object({
  full_name: z.string().trim().min(1, "Informe seu nome").max(120),
  password: z.string().min(8, "A senha deve ter ao menos 8 caracteres"),
})

export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>

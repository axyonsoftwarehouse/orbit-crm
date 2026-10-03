import { z } from "zod"

export const tenantSettingsSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome da empresa").max(120),
  primary_color: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida")
    .default("#0062FF"),
})

export type TenantSettingsInput = z.infer<typeof tenantSettingsSchema>

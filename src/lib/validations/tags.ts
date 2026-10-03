import { z } from "zod"

export const tagSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome da tag").max(60),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida")
    .default("#0062FF"),
})

export type TagInput = z.infer<typeof tagSchema>

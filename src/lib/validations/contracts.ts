import { z } from "zod"
import {
  optionalDate,
  optionalLongText,
  optionalNumber,
} from "@/lib/validations/fields"

export const contractSchema = z.object({
  title: z.string().trim().min(1, "Informe o título").max(200),
  company_id: z.string().uuid().optional(),
  description: optionalLongText,
  content: optionalLongText,
  value: optionalNumber(),
  start_date: optionalDate,
  end_date: optionalDate,
  status: z.coerce.number().int().min(1).max(3).default(1),
  note: optionalLongText,
  require_login: z.coerce.boolean().default(false),
})

export type ContractInput = z.infer<typeof contractSchema>

/** Aceite no link público: nome, e-mail, assinatura PNG e consentimento. */
export const signContractSchema = z.object({
  firstname: z.string().trim().min(1, "Informe o nome").max(80),
  lastname: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((value) => (value ? value : undefined)),
  email: z.string().trim().email("E-mail inválido").max(200),
  signature: z.string().min(1, "Assine no quadro"),
  consent: z.literal(true, {
    message: "É necessário aceitar o termo para assinar",
  }),
})

export type SignContractInput = z.infer<typeof signContractSchema>

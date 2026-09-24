import { z } from "zod"

const optionalText = z
  .string()
  .trim()
  .max(500)
  .optional()
  .transform((value) => (value ? value : undefined))

export const companySchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do cliente").max(200),
  vat: optionalText,
  phone: optionalText,
  website: optionalText,
  address: optionalText,
  city: optionalText,
  state: optionalText,
  zip: optionalText,
  country: optionalText,
  notes: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((value) => (value ? value : undefined)),
})

export type CompanyInput = z.infer<typeof companySchema>

export const contactSchema = z.object({
  first_name: z.string().trim().min(1, "Informe o nome do contato").max(120),
  last_name: optionalText,
  email: z
    .union([z.string().trim().email("E-mail inválido"), z.literal("")])
    .optional()
    .transform((value) => (value ? value : undefined)),
  phone: optionalText,
  title: optionalText,
  is_primary: z.boolean().default(false),
})

export type ContactInput = z.infer<typeof contactSchema>

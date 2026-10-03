import { z } from "zod"

export const customFieldDefinitionSchema = z.object({
  entity_type: z.enum(["company", "project", "task", "lead"]),
  label: z.string().trim().min(1, "Informe o rótulo").max(80),
  key: z
    .string()
    .trim()
    .min(1, "Informe a chave")
    .max(60)
    .regex(/^[a-z0-9_]+$/, "Use apenas letras minúsculas, números e _"),
  field_type: z
    .enum(["text", "textarea", "number", "date", "select", "checkbox"])
    .default("text"),
  required: z.boolean().default(false),
  position: z.coerce.number().int().min(0).default(0),
  options: z.array(z.string().trim().min(1)).default([]),
})

export type CustomFieldDefinitionInput = z.infer<
  typeof customFieldDefinitionSchema
>

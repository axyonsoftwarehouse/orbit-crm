import { z } from "zod"
import { optionalLongText, optionalText } from "@/lib/validations/fields"

export const kbCategorySchema = z.object({
  name: z.string().trim().min(1, "Informe o nome").max(120),
  description: optionalLongText,
})

export type KbCategoryInput = z.infer<typeof kbCategorySchema>

export const kbArticleSchema = z.object({
  title: z.string().trim().min(1, "Informe o título").max(200),
  category_id: z.string().uuid().optional(),
  excerpt: optionalText,
  content: optionalLongText,
  is_published: z.boolean().default(false),
})

export type KbArticleInput = z.infer<typeof kbArticleSchema>

export const faqSchema = z.object({
  question: z.string().trim().min(1, "Informe a pergunta").max(300),
  answer: optionalLongText,
  is_published: z.boolean().default(true),
})

export type FaqInput = z.infer<typeof faqSchema>

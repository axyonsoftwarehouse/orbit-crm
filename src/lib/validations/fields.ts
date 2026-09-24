import { z } from "zod"

export const optionalText = z
  .string()
  .trim()
  .max(500)
  .optional()
  .transform((value) => (value ? value : undefined))

export const optionalLongText = z
  .string()
  .trim()
  .max(5000)
  .optional()
  .transform((value) => (value ? value : undefined))

export const optionalDate = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined))

export function optionalNumber() {
  return z.preprocess((value) => {
    if (value === "" || value === null || value === undefined) return undefined
    const parsed = Number(value)
    return Number.isNaN(parsed) ? undefined : parsed
  }, z.number().min(0).optional())
}

import { z } from "zod"

function emptyToUndefined(value: unknown) {
  return typeof value === "string" && value.trim() === "" ? undefined : value
}

const optionalEnv = z.preprocess(emptyToUndefined, z.string().min(1).optional())

const versionEnv = (fallback: string) =>
  z.preprocess(emptyToUndefined, z.string().min(1).default(fallback))

const booleanEnv = z.preprocess(
  (value) => (value === "" ? "false" : value),
  z.enum(["true", "false"]).default("false"),
)

const batchSizeEnv = z.preprocess(
  emptyToUndefined,
  z.coerce.number().int().min(1).max(50).default(5),
)

const serverEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_URL ausente"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY ausente"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_SITE_URL: z.string().min(1).default("http://localhost:3000"),
  NEXT_PUBLIC_APP_NAME: z.string().default("Orbit CRM"),
  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().optional(),
  SUPER_ADMIN_EMAILS: z.string().optional(),
  OPENAI_API_KEY: z.string().min(1).optional(),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),
  SOCIAL_NATIVE_ENABLED: booleanEnv,
  SOCIAL_PUBLISH_BATCH_SIZE: batchSizeEnv,
  INSTAGRAM_APP_ID: optionalEnv,
  INSTAGRAM_APP_SECRET: optionalEnv,
  INSTAGRAM_API_VERSION: versionEnv("v23.0"),
  LINKEDIN_CLIENT_ID: optionalEnv,
  LINKEDIN_CLIENT_SECRET: optionalEnv,
  LINKEDIN_API_VERSION: versionEnv("202601"),
  LINKEDIN_ORGANIZATION_URN: optionalEnv,
})

export type ServerEnv = z.infer<typeof serverEnvSchema>

let cached: ServerEnv | null = null

export function env(): ServerEnv {
  if (cached) return cached

  const parsed = serverEnvSchema.safeParse(process.env)
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ")
    throw new Error(`Variáveis de ambiente inválidas: ${details}`)
  }

  cached = parsed.data
  return cached
}

export function socialNativeEnabled(): boolean {
  return env().SOCIAL_NATIVE_ENABLED === "true"
}

export function superAdminEmails(): string[] {
  return (process.env.SUPER_ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

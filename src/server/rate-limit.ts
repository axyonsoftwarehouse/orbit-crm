import { createHash } from "node:crypto"
import { headers } from "next/headers"
import { createAdminClient } from "@/lib/supabase/admin"
import { logger } from "@/lib/logger"

export async function getClientIp(): Promise<string> {
  const headerList = await headers()
  return (
    (headerList.get("x-forwarded-for") ?? "").split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "unknown"
  )
}

export function hashIdentifier(value: string): string {
  return createHash("sha256")
    .update(value.trim().toLowerCase())
    .digest("hex")
    .slice(0, 32)
}

const LOGIN_IP_LIMIT = 20
const LOGIN_EMAIL_LIMIT = 5
const LOGIN_WINDOW_SECONDS = 60

export async function isLoginRateLimited(email: string): Promise<boolean> {
  const ip = await getClientIp()
  if (
    await isRateLimited(`login:ip:${ip}`, LOGIN_IP_LIMIT, LOGIN_WINDOW_SECONDS)
  ) {
    return true
  }

  return isRateLimited(
    `login:email:${hashIdentifier(email)}`,
    LOGIN_EMAIL_LIMIT,
    LOGIN_WINDOW_SECONDS,
  )
}

export async function isRateLimited(
  bucket: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin.rpc("check_rate_limit", {
      p_bucket: bucket,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    })
    if (error) {
      logger.error("rate_limit.failed", { bucket, error: error.message })
      return false
    }
    return data === false
  } catch (error) {
    logger.error("rate_limit.exception", {
      bucket,
      error: error instanceof Error ? error.message : String(error),
    })
    return false
  }
}

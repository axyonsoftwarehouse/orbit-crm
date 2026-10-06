import { NextResponse } from "next/server"
import { timingSafeEqual } from "node:crypto"
import { runReminders } from "@/server/reminders"
import { logger } from "@/lib/logger"

export const dynamic = "force-dynamic"

function safeEqual(a: string, b: string) {
  const bufferA = Buffer.from(a)
  const bufferB = Buffer.from(b)
  if (bufferA.length !== bufferB.length) return false
  return timingSafeEqual(bufferA, bufferB)
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    logger.error("cron.reminders.missing_secret")
    return NextResponse.json({ error: "server_misconfigured" }, { status: 503 })
  }

  const auth = request.headers.get("authorization") ?? ""
  if (!safeEqual(auth, `Bearer ${secret}`)) {
    logger.warn("cron.reminders.unauthorized")
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  try {
    const result = await runReminders()
    logger.info("cron.reminders", { result })
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    logger.error("cron.reminders.failed", {
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json({ error: "internal" }, { status: 500 })
  }
}

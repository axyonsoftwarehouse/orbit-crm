import { NextResponse } from "next/server"
import { runReminders } from "@/server/reminders"
import { logger } from "@/lib/logger"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = request.headers.get("authorization")
    if (auth !== `Bearer ${secret}`) {
      logger.warn("cron.reminders.unauthorized")
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }
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

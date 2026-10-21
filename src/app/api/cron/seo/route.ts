import { NextResponse } from "next/server"
import { timingSafeEqual } from "node:crypto"
import { logger } from "@/lib/logger"
import { runScheduledSeoAudits } from "@/server/seo/scheduled"

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
    logger.error("cron.seo.missing_secret")
    return NextResponse.json({ error: "server_misconfigured" }, { status: 503 })
  }

  const auth = request.headers.get("authorization") ?? ""
  if (!safeEqual(auth, `Bearer ${secret}`)) {
    logger.warn("cron.seo.unauthorized")
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  try {
    const result = await runScheduledSeoAudits()
    logger.info("cron.seo", { result })
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    logger.error("cron.seo.failed", {
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json({ error: "internal" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { runReminders } from "@/server/reminders"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = request.headers.get("authorization")
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }
  }

  const result = await runReminders()
  return NextResponse.json({ ok: true, ...result })
}

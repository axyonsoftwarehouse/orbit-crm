import type { SupabaseClient } from "@supabase/supabase-js"
import { todayIso } from "@/lib/format"
import { logger } from "@/lib/logger"
import { endOfTodayUtc, formatNextStep } from "@/lib/lead-activity"
import { createNotification } from "@/server/notifications"
import { sendTenantEmail } from "@/server/email"
import {
  OPEN_NEXT_STEP_SELECT,
  toOpenNextSteps,
} from "@/server/queries/lead-next-steps"

const APP_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "http://localhost:3000"

export type NextStepReminderResult = {
  reminders: number
  emails: number
}

/**
 * Avisa (sino + e-mail) os próximos passos de hoje e os atrasados que ainda
 * não foram lembrados. Roda no cron da manhã; cada passo é lembrado uma vez.
 */
export async function runLeadNextStepReminders(
  admin: SupabaseClient,
  now: Date = new Date(),
): Promise<NextStepReminderResult> {
  const result: NextStepReminderResult = { reminders: 0, emails: 0 }

  const { data, error } = await admin
    .from("lead_activities")
    .select(`tenant_id, ${OPEN_NEXT_STEP_SELECT}`)
    .not("next_step_at", "is", null)
    .is("next_step_done_at", null)
    .is("next_step_reminded_at", null)
    .lt("next_step_at", endOfTodayUtc(now))
    .order("next_step_at")
    .limit(500)

  if (error) {
    logger.error("lead_next_steps.list_failed", { error: error.message })
    return result
  }

  const rows = (data ?? []) as unknown as { id: string; tenant_id: string }[]
  const tenantById = new Map(rows.map((row) => [row.id, row.tenant_id]))
  const steps = toOpenNextSteps(rows)
  const today = todayIso(now)

  for (const step of steps) {
    const tenantId = tenantById.get(step.id) as string
    if (!step.owner_id) continue

    const when = formatNextStep(step.next_step_at, now)
    const late = todayIso(new Date(step.next_step_at)) < today
    const note = step.next_step_note ?? "Sem descrição"

    try {
      await createNotification(admin, {
        tenantId,
        userId: step.owner_id,
        type: "lead_next_step",
        title: late
          ? `Próximo passo atrasado: ${step.lead_name}`
          : `Próximo passo hoje: ${step.lead_name}`,
        body: `${when}: ${note}`,
        url: `/app/leads/${step.lead_id}`,
      })
      result.reminders++

      const email = await userEmail(admin, step.owner_id)
      if (email) {
        const sent = await sendTenantEmail(admin, {
          tenantId,
          templateKey: "lead_next_step",
          to: email,
          vars: {
            lead: step.lead_name,
            when,
            note,
            url: `${APP_URL}/app/leads/${step.lead_id}`,
          },
        })
        if (sent.sent) result.emails++
      }
    } catch (err) {
      logger.error("lead_next_steps.remind_failed", {
        activity: step.id,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  // Marca todos os lidos (inclusive de leads excluídos ou sem dono) para não
  // voltarem amanhã.
  const ids = rows.map((row) => row.id)
  if (ids.length > 0) {
    const { error: markError } = await admin
      .from("lead_activities")
      .update({ next_step_reminded_at: now.toISOString() })
      .in("id", ids)
    if (markError) {
      logger.error("lead_next_steps.mark_failed", { error: markError.message })
    }
  }

  return result
}

/** E-mail do usuário, se ele aceita lembretes por e-mail. */
async function userEmail(admin: SupabaseClient, userId: string) {
  const { data: profile } = await admin
    .from("profiles")
    .select("notify_email")
    .eq("id", userId)
    .maybeSingle()
  const allowed =
    (profile as { notify_email: boolean } | null)?.notify_email ?? true
  if (!allowed) return null
  const { data } = await admin.auth.admin.getUserById(userId)
  return data.user?.email ?? null
}

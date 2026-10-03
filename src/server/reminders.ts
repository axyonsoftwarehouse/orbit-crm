import { createAdminClient } from "@/lib/supabase/admin"
import { createNotification } from "@/server/notifications"
import { sendTenantEmail } from "@/server/email"

const APP_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "http://localhost:3000"

export async function runReminders(): Promise<{
  tenants: number
  notifications: number
  emails: number
}> {
  const admin = createAdminClient()
  const { data: tenants } = await admin.from("tenants").select("id, name")

  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)
  const inTwoDays = new Date(Date.now() + 2 * 86_400_000)
    .toISOString()
    .slice(0, 10)

  let notifications = 0
  let emails = 0

  async function emailFor(userId: string) {
    const { data } = await admin.auth.admin.getUserById(userId)
    return data.user?.email ?? null
  }

  async function emailAllowed(userId: string) {
    const { data } = await admin
      .from("profiles")
      .select("notify_email")
      .eq("id", userId)
      .maybeSingle()
    return (data as { notify_email: boolean } | null)?.notify_email ?? true
  }

  for (const tenant of tenants ?? []) {
    // Tarefas vencendo (2 dias), não concluídas, com responsável
    const { data: tasks } = await admin
      .from("tasks")
      .select("id, name, due_date, assignee_id")
      .eq("tenant_id", tenant.id)
      .is("deleted_at", null)
      .neq("status", 5)
      .not("assignee_id", "is", null)
      .gte("due_date", todayStr)
      .lte("due_date", inTwoDays)

    for (const task of tasks ?? []) {
      await createNotification(admin, {
        tenantId: tenant.id,
        userId: task.assignee_id as string,
        type: "task_due",
        title: `Tarefa vencendo: ${task.name}`,
        body: `Prazo em ${task.due_date}.`,
        url: `/app/tarefas/${task.id}`,
      })
      notifications++

      const email = await emailFor(task.assignee_id as string)
      if (email && (await emailAllowed(task.assignee_id as string))) {
        const result = await sendTenantEmail(admin, {
          tenantId: tenant.id,
          templateKey: "task_due",
          to: email,
          vars: {
            task: task.name,
            due_date: task.due_date ?? "",
            url: `${APP_URL}/app/tarefas/${task.id}`,
          },
        })
        if (result.sent) emails++
      }
    }

    // Faturas vencidas (em aberto/parcial)
    const { data: invoices } = await admin
      .from("invoices")
      .select("id, formatted_number, total, due_date")
      .eq("tenant_id", tenant.id)
      .is("deleted_at", null)
      .in("status", [1, 3])
      .lt("due_date", todayStr)

    if (invoices && invoices.length > 0) {
      const { data: admins } = await admin
        .from("memberships")
        .select("user_id")
        .eq("tenant_id", tenant.id)
        .eq("status", "active")
        .in("role", ["owner", "admin"])

      for (const invoice of invoices) {
        for (const adminUser of admins ?? []) {
          await createNotification(admin, {
            tenantId: tenant.id,
            userId: adminUser.user_id,
            type: "invoice_overdue",
            title: `Fatura vencida: ${invoice.formatted_number}`,
            body: `Venceu em ${invoice.due_date}.`,
            url: `/app/faturas/${invoice.id}`,
          })
          notifications++

          const email = await emailFor(adminUser.user_id)
          if (email && (await emailAllowed(adminUser.user_id))) {
            const result = await sendTenantEmail(admin, {
              tenantId: tenant.id,
              templateKey: "invoice_overdue",
              to: email,
              vars: {
                number: invoice.formatted_number,
                due_date: invoice.due_date ?? "",
                url: `${APP_URL}/app/faturas/${invoice.id}`,
              },
            })
            if (result.sent) emails++
          }
        }
      }
    }
  }

  return { tenants: (tenants ?? []).length, notifications, emails }
}

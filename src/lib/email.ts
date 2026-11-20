import { env } from "@/lib/env"

export type EmailAttachment = {
  filename: string
  /** Conteúdo em base64. */
  content: string
}

type SendEmailInput = {
  to: string
  subject: string
  html: string
  attachments?: EmailAttachment[]
}

export async function sendEmail({
  to,
  subject,
  html,
  attachments,
}: SendEmailInput): Promise<{
  sent: boolean
  skipped?: boolean
  error?: string
}> {
  const { RESEND_API_KEY: key, EMAIL_FROM } = env()
  const from = EMAIL_FROM ?? "Orbit CRM <nao-responda@orbitcrm.app>"

  if (!key) {
    console.log("[email] RESEND_API_KEY ausente; envio ignorado")
    return { sent: false, skipped: true }
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        html,
        ...(attachments?.length ? { attachments } : {}),
      }),
    })

    if (!response.ok) {
      const text = await response.text()
      console.error(`[email] falha ao enviar: ${text}`)
      return { sent: false, error: text }
    }
    return { sent: true }
  } catch (error) {
    console.error("[email] erro", error)
    return { sent: false, error: "network" }
  }
}

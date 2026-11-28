import { env } from "@/lib/env"
import { LEGAL_PATHS } from "@/lib/legal"

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

/** Rodapé com o link da Política de privacidade, em todo e-mail enviado. */
export function emailFooterHtml(siteUrl: string): string {
  const base = siteUrl.replace(/\/$/, "")
  return (
    '<p style="margin-top:32px;padding-top:12px;border-top:1px solid #e5e7eb;' +
    'font-size:12px;color:#6b7280">Enviado pelo Orbit CRM · ' +
    `<a href="${base}${LEGAL_PATHS.privacy}" style="color:#6b7280">` +
    "Política de privacidade</a></p>"
  )
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
  const { RESEND_API_KEY: key, EMAIL_FROM, NEXT_PUBLIC_SITE_URL } = env()
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
        html: html + emailFooterHtml(NEXT_PUBLIC_SITE_URL),
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

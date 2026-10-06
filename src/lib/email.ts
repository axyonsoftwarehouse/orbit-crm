type SendEmailInput = {
  to: string
  subject: string
  html: string
}

export async function sendEmail({
  to,
  subject,
  html,
}: SendEmailInput): Promise<{
  sent: boolean
  skipped?: boolean
  error?: string
}> {
  const key = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM ?? "Orbit CRM <nao-responda@orbitcrm.app>"

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
      body: JSON.stringify({ from, to, subject, html }),
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

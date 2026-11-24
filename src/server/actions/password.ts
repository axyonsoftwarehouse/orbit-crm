"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendEmail } from "@/lib/email"
import { escapeHtml } from "@/lib/email-templates"
import { logger } from "@/lib/logger"
import {
  emailSchema,
  newPasswordSchema,
  parseArea,
  type AuthArea,
} from "@/lib/validations/auth"
import { getBaseUrl } from "@/server/base-url"
import { getClientIp, hashIdentifier, isRateLimited } from "@/server/rate-limit"

export type PasswordFormState =
  { error?: string; success?: string; needsNewLink?: boolean } | undefined

const GENERIC_SENT =
  "Se houver uma conta com esse e-mail, enviamos um link para criar uma nova senha. Confira sua caixa de entrada (e o spam)."

function areaPrefix(area: AuthArea) {
  return area === "portal" ? "/portal" : ""
}

function resetEmailHtml(link: string, area: AuthArea) {
  const where = area === "portal" ? "do portal do cliente" : "do Orbit CRM"
  const safe = escapeHtml(link)
  return `<p>Recebemos um pedido para redefinir a senha ${where}.</p><p><a href="${safe}">Criar uma nova senha</a></p><p>O link vale por 1 hora e só pode ser usado uma vez. Se você não pediu, ignore este e-mail: sua senha continua a mesma.</p>`
}

/**
 * "Esqueci minha senha": gera um link de recuperação do Supabase (token de
 * uso único) e manda pelo nosso e-mail. A resposta é sempre a mesma, exista
 * ou não a conta, para não revelar quais e-mails estão cadastrados.
 */
export async function requestPasswordResetAction(
  _prevState: PasswordFormState,
  formData: FormData,
): Promise<PasswordFormState> {
  const area = parseArea(formData.get("area"))
  const parsed = emailSchema.safeParse(formData.get("email"))
  if (!parsed.success) return { error: "Informe um e-mail válido." }
  const email = parsed.data

  const ip = await getClientIp()
  if (
    (await isRateLimited(`reset:ip:${ip}`, 10, 3600)) ||
    (await isRateLimited(`reset:email:${hashIdentifier(email)}`, 3, 3600))
  ) {
    return { error: "Muitos pedidos. Tente novamente mais tarde." }
  }

  try {
    const admin = createAdminClient()
    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
    })
    const tokenHash = data?.properties?.hashed_token
    if (error || !tokenHash) {
      // E-mail sem conta (ou falha do Auth): mesma resposta para quem pediu.
      logger.info("auth.password_reset.no_link", {
        error: error?.message ?? "sem token",
      })
      return { success: GENERIC_SENT }
    }

    const link = `${await getBaseUrl()}${areaPrefix(area)}/redefinir-senha?token=${encodeURIComponent(tokenHash)}`
    const result = await sendEmail({
      to: email,
      subject:
        area === "portal"
          ? "Redefinir sua senha do portal do cliente"
          : "Redefinir sua senha do Orbit CRM",
      html: resetEmailHtml(link, area),
    })
    if (result.skipped && process.env.NODE_ENV !== "production") {
      // Sem Resend no ambiente local: o link aparece no console do servidor.
      console.log(`[email] link de redefinição de senha: ${link}`)
    }
    if (result.error) {
      logger.error("auth.password_reset.send_failed", { error: result.error })
    }
  } catch (error) {
    logger.error("auth.password_reset.failed", {
      error: error instanceof Error ? error.message : String(error),
    })
  }

  return { success: GENERIC_SENT }
}

/**
 * Define a nova senha a partir do link. O token só é consumido aqui (no
 * envio do formulário), e não ao abrir a página, para que leitores de link
 * de antivírus/e-mail não o invalidem antes do usuário.
 */
export async function resetPasswordAction(
  _prevState: PasswordFormState,
  formData: FormData,
): Promise<PasswordFormState> {
  const area = parseArea(formData.get("area"))
  const token = String(formData.get("token") ?? "")
  if (!token) {
    return { error: "Link inválido. Peça um novo.", needsNewLink: true }
  }

  const parsed = newPasswordSchema.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }

  const supabase = await createClient()
  const { error: verifyError } = await supabase.auth.verifyOtp({
    type: "recovery",
    token_hash: token,
  })
  if (verifyError) {
    return {
      error: "Este link é inválido ou expirou. Peça um novo.",
      needsNewLink: true,
    }
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  })
  if (error) {
    logger.warn("auth.password_reset.update_failed", {
      code: error.code ?? null,
      error: error.message,
    })
    return {
      error:
        error.code === "same_password"
          ? "A nova senha precisa ser diferente da atual. Peça um novo link e tente outra."
          : "Não foi possível salvar a nova senha. Peça um novo link.",
      needsNewLink: true,
    }
  }

  redirect(area === "portal" ? "/portal" : "/app")
}

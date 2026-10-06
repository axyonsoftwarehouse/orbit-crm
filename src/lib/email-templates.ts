export type EmailTemplateDefault = {
  label: string
  description: string
  subject: string
  body: string
}

export const EMAIL_TEMPLATES: Record<string, EmailTemplateDefault> = {
  task_due: {
    label: "Tarefa vencendo",
    description:
      "Lembrete enviado ao responsável quando a tarefa está a vencer.",
    subject: "[Orbit CRM] Tarefa vencendo: {{task}}",
    body: '<p>Sua tarefa <strong>{{task}}</strong> vence em {{due_date}}.</p><p><a href="{{url}}">Abrir tarefa</a></p>',
  },
  invoice_overdue: {
    label: "Fatura vencida",
    description: "Aviso enviado aos administradores quando uma fatura vence.",
    subject: "[Orbit CRM] Fatura vencida {{number}}",
    body: '<p>A fatura <strong>{{number}}</strong> venceu em {{due_date}}.</p><p><a href="{{url}}">Abrir fatura</a></p>',
  },
  member_invite: {
    label: "Convite de equipe",
    description: "Enviado ao convidado com o link de aceite.",
    subject: "Convite para {{tenant}}",
    body: '<p>Você foi convidado para a empresa <strong>{{tenant}}</strong> no Orbit CRM.</p><p><a href="{{link}}">Aceitar convite</a></p><p>Ou copie e cole no navegador:<br />{{link}}</p>',
  },
}

export function renderTemplate(
  text: string,
  vars: Record<string, string>,
): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? "")
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

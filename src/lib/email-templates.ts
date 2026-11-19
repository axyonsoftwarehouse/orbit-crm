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
    body: '<p>VocǦ foi convidado para a empresa <strong>{{tenant}}</strong> no Orbit CRM.</p><p><a href="{{link}}">Aceitar convite</a></p><p>Ou copie e cole no navegador:<br />{{link}}</p>',
  },
  social_publish_due: {
    label: "Post agendado (manual)",
    description:
      "Lembrete enviado ao autor quando um post agendado precisa ser publicado manualmente.",
    subject: "[Orbit CRM] Post para publicar: {{post}}",
    body: '<p>O post <strong>{{post}}</strong> está agendado para {{scheduled_at}}.</p><p>Abra o Orbit para copiar o conteúdo e publicar.</p><p><a href="{{url}}">Abrir post</a></p>',
  },
  social_approval_requested: {
    label: "Post aguardando aprovação (cliente)",
    description:
      "Enviado aos contatos do cliente com acesso ao portal quando um post entra em aprovação.",
    subject: "[{{company}}] Post aguardando sua aprovação",
    body: '<p>Há um post aguardando a sua aprovação:</p><p><strong>{{post}}</strong></p><p><a href="{{url}}">Revisar no portal</a></p>',
  },
  social_approval_response: {
    label: "Resposta do cliente a um post",
    description:
      "Enviado ao autor do post (ou a owner/admin) quando o cliente aprova ou rejeita no portal.",
    subject: "[Orbit CRM] Cliente {{decision}} o post: {{post}}",
    body: '<p>O cliente <strong>{{decision}}</strong> o post <strong>{{post}}</strong>.</p><p>{{note}}</p><p><a href="{{url}}">Abrir post</a></p>',
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

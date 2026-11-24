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
  portal_invite: {
    label: "Convite do portal do cliente",
    description:
      'Enviado ao contato ao clicar em "Dar acesso": o link (válido por 7 dias) leva o cliente a definir a própria senha.',
    subject: "{{tenant}} convidou você para o portal do cliente",
    body: '<p>Olá, {{name}}!</p><p><strong>{{tenant}}</strong> liberou para você o acesso ao portal do cliente, onde você acompanha projetos, orçamentos, faturas e tickets.</p><p><a href="{{link}}">Criar minha senha e entrar</a></p><p>O link vale por 7 dias. Ou copie e cole no navegador:<br />{{link}}</p>',
  },
  social_publish_due: {
    label: "Post agendado (manual)",
    description:
      "Lembrete enviado ao autor quando um post agendado precisa ser publicado manualmente.",
    subject: "[Orbit CRM] Post para publicar: {{post}}",
    body: '<p>O post <strong>{{post}}</strong> está agendado para {{scheduled_at}}.</p><p>Abra o Orbit para copiar o conteúdo e publicar.</p><p><a href="{{url}}">Abrir post</a></p>',
  },
  estimate_sent: {
    label: "Orçamento enviado ao cliente",
    description:
      'Enviado aos contatos escolhidos ao clicar em "Enviar ao cliente" no orçamento. O PDF vai anexo.',
    subject: "Orçamento {{number}} · {{tenant}}",
    body: '<p>Olá,</p><p><strong>{{tenant}}</strong> enviou o orçamento <strong>{{number}}</strong> no valor de <strong>{{total}}</strong>, válido até {{date}}.</p><p>{{message}}</p><p><a href="{{link}}">Ver e responder o orçamento</a></p><p>O PDF segue em anexo.</p>',
  },
  invoice_sent: {
    label: "Fatura enviada ao cliente",
    description:
      'Enviada aos contatos escolhidos ao clicar em "Enviar ao cliente" na fatura. O PDF vai anexo.',
    subject: "Fatura {{number}} · {{tenant}}",
    body: '<p>Olá,</p><p><strong>{{tenant}}</strong> enviou a fatura <strong>{{number}}</strong> no valor de <strong>{{total}}</strong>, com vencimento em {{date}}.</p><p>{{message}}</p><p><a href="{{link}}">Ver a fatura</a></p><p>O PDF segue em anexo.</p>',
  },
  contract_sent: {
    label: "Contrato enviado para assinatura",
    description:
      'Enviado aos contatos escolhidos ao clicar em "Enviar para assinatura" no contrato. O PDF vai anexo.',
    subject: "Contrato {{title}} · {{tenant}}",
    body: '<p>Olá,</p><p><strong>{{tenant}}</strong> enviou o contrato <strong>{{title}}</strong> para assinatura.</p><p>{{message}}</p><p><a href="{{link}}">Ler e assinar o contrato</a></p><p>O PDF segue em anexo.</p>',
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
  portal_estimate_response: {
    label: "Resposta do cliente a um orçamento",
    description:
      "Enviado ao criador do orçamento (ou a owner/admin) quando o cliente aceita ou recusa no portal.",
    subject: "[Orbit CRM] {{company}} {{decision}} o orçamento {{number}}",
    body: '<p><strong>{{company}}</strong> {{decision}} o orçamento <strong>{{number}}</strong> pelo portal.</p><p><a href="{{url}}">Abrir orçamento</a></p>',
  },
  portal_ticket_opened: {
    label: "Ticket aberto pelo cliente",
    description:
      "Enviado ao responsável pelo ticket (ou a owner/admin) quando o cliente abre um ticket no portal.",
    subject: "[Orbit CRM] Novo ticket de {{company}}: {{number}} {{subject}}",
    body: '<p><strong>{{company}}</strong> abriu o ticket <strong>{{number}} {{subject}}</strong> pelo portal.</p><p>{{message}}</p><p><a href="{{url}}">Abrir ticket</a></p>',
  },
  portal_ticket_reply: {
    label: "Mensagem do cliente em ticket",
    description:
      "Enviado ao responsável pelo ticket (ou a owner/admin) quando o cliente responde pelo portal.",
    subject: "[Orbit CRM] {{company}} respondeu o ticket {{number}}",
    body: '<p><strong>{{company}}</strong> respondeu o ticket <strong>{{number}} {{subject}}</strong>:</p><p>{{message}}</p><p><a href="{{url}}">Abrir ticket</a></p>',
  },
  ticket_reply_client: {
    label: "Resposta da equipe em ticket (cliente)",
    description:
      "Enviado ao contato que abriu o ticket, se tiver acesso ao portal, quando a equipe responde (notas internas não disparam).",
    subject: "[{{tenant}}] Resposta no ticket {{number}}",
    body: '<p>Há uma nova resposta no seu ticket <strong>{{number}} {{subject}}</strong>:</p><p>{{message}}</p><p><a href="{{url}}">Ver no portal</a></p>',
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

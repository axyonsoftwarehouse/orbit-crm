# Social — aprovação obrigatória e notificações de aprovação (item #29)

## Por quê

O item #29 de `docs/mapa/06-problemas-e-dividas.md` registra duas divergências entre
o Social e a spec (`docs/specs/social-media.md`, FR-04 e FR-10):

1. `social_settings.approval_required` só define o valor inicial da caixa
   "Exigir aprovação do cliente". Qualquer pessoa desmarca e o servidor aceita. Não
   há tela para mudar a configuração.
2. Ninguém é avisado quando um post entra em aprovação nem quando o cliente aprova
   ou rejeita no portal.

## Objetivos

- **Aprovação obrigatória (opção A, escolhida):** com `approval_required = true`,
  todo post nasce exigindo aprovação, para qualquer papel. O servidor ignora a caixa.
  O formulário troca a caixa por um aviso.
- **Tela `/app/social/configuracoes`:** só owner/admin. Por enquanto tem só a chave
  "Aprovação do cliente obrigatória". Com a chave desligada, a caixa volta ao
  formulário, desmarcada por padrão.
- **Aviso ao cliente:** quando o post vai para `pending_approval`
  (`submitSocialPostAction`), enviar e-mail aos contatos do cliente com acesso ao
  portal (`contacts.user_id` e `email` preenchidos, não excluídos). O portal não tem
  sino de notificações, por isso só e-mail.
- **Aviso à equipe:** quando o cliente aprova ou rejeita no portal
  (`respondPortalSocialPostAction`, se o RPC devolver `true`), enviar notificação no
  app e e-mail (respeitando `profiles.notify_email`) ao autor do post. Sem autor,
  avisar os owner/admin ativos, como em `src/server/social/reminders.ts`.

## Fora do escopo

- Aprovação interna (owner/admin aprovando no app) não gera aviso.
- Nova aprovação após editar o conteúdo: não existe ação de edição de post.
- Rate limit no envio para aprovação, fuso, retries e demais campos de
  `social_settings` na tela nova.
- Sino de notificações no portal.

## O que não pode acontecer

- Falha de e-mail ou de notificação desfazer ou bloquear a transição do post. Os
  avisos são best-effort: ficam em `try/catch`, logam com `logger` e seguem.
- Avisar contatos de outro cliente ou de outro tenant.
- `member` alterar a configuração (bloqueado na action e no RLS de
  `social_settings`).

## Abordagens consideradas

- **A. Obrigatória para todos, com tela de configurações (escolhida).** Segue o FR-04
  da spec. Custa uma tela.
- B. Obrigatória só para `member`, sem tela nova. Regra mais difícil de explicar e
  diverge da spec.

Para os avisos, a única via viável é o cliente admin (service role): a policy
`notifications_insert` só deixa o usuário criar notificação para si mesmo, e o portal
não lê `memberships`/`profiles` da equipe. É o mesmo padrão dos lembretes.

## Desenho

- `src/lib/social-approval.ts` (puro): `resolveRequiresApproval(settingRequired,
  requested)`.
- `src/server/social/approval-notifications.ts` (server-only, admin client):
  - `notifyPortalApprovalRequested({ tenantId, postId })`: busca o post (conteúdo,
    `company_id`) e os contatos com portal e manda o template
    `social_approval_requested` (link `/portal/social/{id}`).
  - `notifyStaffPortalResponse({ postId, approved, note })`: busca o post
    (`tenant_id`, `created_by`, conteúdo), resolve os destinatários, cria a
    notificação (`type: "social_approval_response"`, link `/app/social/{id}`) e manda
    o template `social_approval_response`.
- `EMAIL_TEMPLATES` ganha `social_approval_requested` e `social_approval_response`.
  Assim os dois aparecem para personalização em Configurações > E-mails.
- `createSocialPostAction` lê `getSocialSettings` e usa `resolveRequiresApproval`.
- `updateSocialSettingsAction` (`isManager`, upsert de `{ tenant_id,
  approval_required }`), revalida `/app/social`.
- Página `/app/social/configuracoes` com formulário de chave no padrão de
  `notification-prefs-form.tsx`. O botão "Configurações" na página do Social só
  aparece para owner/admin.
- Sem migration: a tabela e as policies já existem (`0049`).

## Testes

- Unitário de `resolveRequiresApproval`.
- Unitários dos dois avisos com o mock de Supabase (`tests/unit/supabase-mock.ts`):
  destinatários certos, filtro por tenant/cliente, `notify_email` respeitado,
  falha engolida.
- Unitários das actions: criação força aprovação; `updateSocialSettingsAction`
  recusa `member`; o portal só avisa quando o RPC devolve `true`.

## Fica a critério de quem implementa

- Texto exato dos e-mails e do aviso no formulário.
- Atualizar o item #29 no mapa (`06-problemas-e-dividas.md`) e marcar o #20
  (Sentry) como resolvido no PR #35.

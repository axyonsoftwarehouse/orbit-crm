# Checklist de produção (clientes pagantes)

O que precisa estar pronto **antes do primeiro cliente pagante** e o que
conferir depois de cada mudança relevante. Issue de origem: #53.

**Estado conferido em 27/11/2026.** As variáveis foram lidas com
`vercel env ls production` (nomes, sem valores) e o código foi revisado na
`main`. Itens marcados com ✅ já estão feitos. Os com ❌ estão pendentes e os
com ❓ não puderam ser conferidos daqui.

## 1. Bloqueadores

- [ ] ❌ **E-mail transacional (Resend).** Em produção não existem
      `RESEND_API_KEY` nem `EMAIL_FROM`. Sem a chave, `sendEmail` ignora o
      envio **sem erro**. Hoje, portanto, **não saem**:
  - convites de equipe e do portal do cliente;
  - **redefinição de senha** (app e portal);
  - lembretes do cron (tarefas, faturas, próximo passo de lead, Social);
  - envio de faturas, orçamentos e contratos por e-mail;
  - avisos de aprovação do Social.

  Passos: verificar o domínio no Resend (SPF/DKIM), criar a chave e cadastrar
  `RESEND_API_KEY` e `EMAIL_FROM` (ex.: `Orbit CRM <nao-responda@seudominio>`)
  em _Production_. Depois, redeploy e o teste da seção 8.

- [ ] ❌ **Vercel no plano Pro.** O Hobby é só para uso não comercial. Migrar
      antes de cobrar. O Pro também permite crons mais frequentes que o diário,
      caso algum dia faça falta.
- [ ] ❓ **Supabase: plano e backups.** O projeto de produção (ref
      `mjdtfbwwbsxlijjeunll`) não está na conta conectada ao Claude, então o
      plano não foi conferido. No gratuito há 1 GB de storage no projeto
      inteiro, pausa por inatividade e nenhum backup recuperável. Para cliente
      pagante:
  - Pro (ou superior), com backups diários;
  - avaliar PITR (restauração a um ponto no tempo);
  - fazer **um teste de restauração** e anotar quanto tempo levou.
- [ ] ❌ **Termos de uso e política de privacidade (LGPD).** As páginas
      `/termos` e `/privacidade` existem como **rascunho**: falta preencher os
      dados da empresa e passar por revisão jurídica. Ver a seção 6.

## 2. Variáveis de ambiente na Vercel (_Production_)

| Variável                                              | Estado | Observação                                                                          |
| ----------------------------------------------------- | ------ | ----------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL` / `_ANON_KEY`              | ✅     |                                                                                     |
| `SUPABASE_SERVICE_ROLE_KEY`                           | ✅     | Só no servidor; ignora RLS.                                                         |
| `NEXT_PUBLIC_SITE_URL`                                | ✅     | Conferir se é o domínio final (links de e-mail e de documentos usam este valor).    |
| `NEXT_PUBLIC_APP_NAME`                                | ✅     |                                                                                     |
| `CRON_SECRET`                                         | ✅     | Mesmo valor no `configure_social_publish_cron`, se a publicação nativa for ligada.  |
| `OPENROUTER_API_KEY` / `OPENROUTER_MODEL`             | ✅     | IA usa só provedores sem retenção de dados.                                         |
| `NEXT_PUBLIC_SENTRY_DSN`                              | ✅     |                                                                                     |
| `RESEND_API_KEY` / `EMAIL_FROM`                       | ❌     | Bloqueador (seção 1).                                                               |
| `SUPER_ADMIN_EMAILS`                                  | ❌     | Sem ela ninguém acessa `/plataforma` (criar empresas, trocar plano).                |
| `SUPPORT_EMAIL`                                       | ❌     | Contato de upgrade nos avisos de limite. Sem ela, o aviso diz "fale com o suporte". |
| `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_AUTH_TOKEN` | ❌     | Opcional: source maps legíveis nos erros do Sentry.                                 |
| `NEXT_PUBLIC_ROOT_DOMAIN`                             | —      | Só se for usar subdomínio por empresa.                                              |
| `NEXT_PUBLIC_DEMO_LOGIN`                              | ✅     | Ausente equivale a desligado (só aparece com `"true"`). **Manter assim.**           |
| `SOCIAL_NATIVE_ENABLED` e chaves Meta/LinkedIn        | —      | Ausente equivale a desligado: o Social funciona em modo manual. Ver a seção 5.      |

Toda variável nova exige **redeploy** para valer.

> As variáveis de _Preview_ hoje têm só `NEXT_PUBLIC_SENTRY_DSN` e
> `OPENROUTER_API_KEY`. Assim, os Previews não falam com o banco. Se um dia
> forem ligados à produção, seguir as regras do `AGENTS.md` (tenant de preview
> e nada destrutivo).

## 3. Supabase (produção)

- [ ] ❓ Plano, backups e teste de restauração (seção 1).
- [ ] ❓ **Auth → URL Configuration:** _Site URL_ igual a `NEXT_PUBLIC_SITE_URL`
      e as _Redirect URLs_ com o domínio final.
- [ ] ❓ **Auth → cadastro aberto desligado.** O app não tem tela de cadastro
      (as contas nascem por convite e as empresas por `/plataforma`). Mesmo
      assim, desligar _Allow new users to sign up_ evita contas criadas direto
      pela API.
- [ ] ❓ Migrations em dia: `npx supabase migration list --linked`. O
      workflow `migrate.yml` aplica no merge para a `main`.
- [ ] ❓ Rodar os _advisors_ de segurança e performance do painel e resolver os
      avisos de RLS.

## 4. Crons

- [x] ✅ `vercel.json`: `/api/cron/reminders` às 09:00 UTC (06:00 BRT) e
      `/api/cron/seo` às 09:30 UTC, protegidos por `CRON_SECRET`.
- [ ] Depois de configurar o e-mail, conferir nos logs da Vercel uma execução do
      `reminders` com `emails > 0`.

## 5. Publicação nativa no Social (opcional no lançamento)

Sem ela, o Social funciona em modo manual: a agência copia o texto e marca como
publicado. Para publicar sozinho em contas de clientes, que não são de teste:

- [ ] Meta: app em modo _Live_ com **App Review** aprovado para
      `instagram_business_content_publish` (e permissões relacionadas).
- [ ] LinkedIn: acesso ao **Marketing Developer Platform** (Community
      Management API) para publicar em páginas.
- [ ] Variáveis `SOCIAL_NATIVE_ENABLED=true`, `INSTAGRAM_*` e `LINKEDIN_*` na
      Vercel, e o cron de minuto ativado com
      `select public.configure_social_publish_cron(...)`.

  O passo a passo completo está em [`social-native-setup.md`](social-native-setup.md).

## 6. Jurídico e LGPD

As páginas `/termos` e `/privacidade` já existem (versão preliminar 0.1),
com links nas telas de login e de convite (app e portal) e no rodapé de todos
os e-mails. Para virar a versão final:

- [ ] Preencher em `src/lib/legal.ts`: razão social, CNPJ, endereço, e-mail do
      encarregado (DPO), comarca do foro e região do banco de produção.
      Enquanto faltar algum, a página mostra "[preencher: ...]".
- [ ] Revisão jurídica do texto, em especial:
  - o prazo de **30 dias** para exportar os dados depois do cancelamento (não
    há rotina automática de exclusão; hoje ela seria manual);
  - o limite de responsabilidade (valor pago nos últimos 12 meses);
  - as bases legais citadas e a transferência internacional.
- [ ] Depois da revisão, mudar `draft` para `false` e atualizar `version` e
      `updatedAt` em `src/lib/legal.ts`.
- [ ] Definir o processo de pedidos do titular e de exclusão de conta (hoje a
      exportação existe em `/app/exportar`; a exclusão é manual).
- [ ] (Depois) Registrar no banco quem aceitou e qual versão, com aceite
      explícito no primeiro acesso.

## 7. Plataforma e onboarding

- [ ] ❌ `SUPER_ADMIN_EMAILS` configurada (seção 2).
- [ ] Em `/plataforma`, revisar **todos** os limites de cada plano, inclusive
      `storage_mb` e `social_posts_month`. Limite vazio significa ilimitado.
- [ ] Para cada cliente pagante: criar a empresa, atribuir o plano e convidar
      o owner (depende do e-mail funcionando).
- [ ] Decidir como a cobrança da assinatura vai acontecer: hoje não há
      gateway, então a troca de plano é manual em `/plataforma`. O upgrade é
      pedido pelo `SUPPORT_EMAIL`.

## 8. Teste rápido depois de configurar (produção)

Fazer com uma empresa e usuários de teste próprios, nunca com dados de cliente:

1. Convidar um membro: o e-mail chega e o link abre a tela de convite.
2. "Esqueci minha senha" no app e no portal: o e-mail chega e a troca funciona.
3. Convidar um contato para o portal: o login funciona e ele vê só o próprio
   cliente.
4. Enviar uma fatura por e-mail e abrir o link público do documento.
5. Anexar um arquivo (confere storage e cota).
6. Forçar um erro de teste e ver se ele aparece no Sentry.
7. No dia seguinte, conferir no log do cron `reminders` que os e-mails saíram.

## 9. Rotina

- Revisar o Sentry semanalmente.
- Trocar `CRON_SECRET` e `SUPABASE_SERVICE_ROLE_KEY` se houver suspeita de
  vazamento (atualizar Vercel e o cron do Social juntos).
- Repetir o teste de restauração do backup a cada trimestre.

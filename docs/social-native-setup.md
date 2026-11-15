# Configuração da publicação nativa (Instagram e LinkedIn)

Este guia cobre a ativação do modo nativo do módulo Social do Orbit CRM. Ele
publica direto no Instagram (conta Professional, via Instagram Login) e no
LinkedIn (perfil pessoal e Página da empresa), sem agregador.

O mapa do código (OAuth, Vault, providers, worker e retries) está em
[`docs/mapa/arquivos/21-publicacao-nativa.md`](mapa/arquivos/21-publicacao-nativa.md).

## 1. Visão geral

Fluxo:

```text
/app/social/contas
  -> /api/social/connect/<provider>   (OAuth)
  -> /api/social/callback/<provider>  (troca o código por token)
  -> Supabase Vault                   (access/refresh tokens)
  -> /api/social/publish              (worker chamado pelo pg_cron)
  -> Instagram / LinkedIn
```

O modo manual continua funcionando para as demais redes. Quando uma conta é
conectada, o tenant passa a ter `social_settings.publish_mode = 'provider'`;
somente posts agendados nesse modo entram na fila automática.

## 2. Pré-requisitos

- Migrations `0053` e `0054` aplicadas no projeto Supabase.
- Projeto publicado em uma URL pública estável (a Meta precisa baixar a imagem).
- `NEXT_PUBLIC_SITE_URL` apontando para essa URL em produção.
- `CRON_SECRET` configurado na Vercel.
- Conta Instagram Professional (Business ou Creator) para o Instagram.
- Página do LinkedIn e permissão de administrador para publicar como Página.
- Uma empresa/cliente cadastrado no Orbit (o compositor exige um cliente).

> `localhost` não funciona para o Instagram: a Meta busca a imagem em uma URL
> pública. Para testar localmente, use um túnel (ngrok, cloudflared) e ajuste
> `NEXT_PUBLIC_SITE_URL` e as redirect URIs.

## 3. Variáveis de ambiente

Configure na Vercel (Production/Preview) e, se necessário, no `.env.local`:

```env
SOCIAL_NATIVE_ENABLED=true
SOCIAL_PUBLISH_BATCH_SIZE=5
INSTAGRAM_APP_ID=
INSTAGRAM_APP_SECRET=
INSTAGRAM_API_VERSION=v23.0
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
LINKEDIN_API_VERSION=202601
# Opcional: fixa a Página usada quando o OAuth for de organização
LINKEDIN_ORGANIZATION_URN=
```

- `SOCIAL_NATIVE_ENABLED`: liga os botões de conexão e o worker.
- `SOCIAL_PUBLISH_BATCH_SIZE`: quantos destinos o worker processa por execução.
- `LINKEDIN_API_VERSION`: versão do LinkedIn REST API; ajuste se o LinkedIn
  passar a rejeitar a versão.
- `LINKEDIN_ORGANIZATION_URN`: opcional. Sem ela, o callback busca a primeira
  Página em que você é administrador.

Depois de alterar variáveis na Vercel, faça um novo deploy.

## 4. Instagram (Meta)

1. Acesse <https://developers.facebook.com/apps/> e crie um app do tipo
   **Business**.
2. Adicione o produto **Instagram** e configure **Instagram Business Login**.
3. Em **App Settings > Basic**, informe a política de privacidade, termos e
   instruções de exclusão de dados.
4. Em **Instagram Business Login > Settings**, cadastre a redirect URI:
   `https://SEU-DOMINIO/api/social/callback/instagram`
5. Copie o **Instagram App ID** e o **Instagram App Secret** para
   `INSTAGRAM_APP_ID` e `INSTAGRAM_APP_SECRET`.
6. Em **App Roles > Add People**, adicione sua conta como **Instagram Tester**.
7. Abra o Instagram no celular e aceite o convite em
   `Configurações > Apps e sites > Convites de teste`.
8. No Orbit, acesse `/app/social/contas` e clique em **Conectar Instagram**.

Permissões usadas: `instagram_business_basic` e
`instagram_business_content_publish`.

- Para a **sua** conta como tester, o App Review **não** é necessário.
- Para publicar nas contas de **clientes** (pessoas fora dos testers do app), o
  app precisa estar em modo Live e as permissões precisam passar pelo App
  Review.

Mídia: use **JPEG** de até 8 MB. O worker gera uma URL assinada de 24 horas no
bucket privado `social_media`; a Meta baixa essa URL no momento da publicação.

## 5. LinkedIn

1. Acesse <https://www.linkedin.com/developers/apps> e crie um app.
2. Associe uma Página do LinkedIn da qual você seja administrador (o LinkedIn
   exige uma Página na criação do app, mesmo para publicar no perfil pessoal).
3. Em **Auth**, cadastre a redirect URI:
   `https://SEU-DOMINIO/api/social/callback/linkedin`
4. Copie **Client ID** e **Client Secret** para `LINKEDIN_CLIENT_ID` e
   `LINKEDIN_CLIENT_SECRET`.
5. No produto **Share on LinkedIn**, solicite o escopo `w_member_social` para
   publicar no perfil pessoal.
6. Para publicar em uma **Página da empresa**, solicite acesso ao
   **Marketing Developer Platform** e os escopos `w_organization_social`,
   `r_organization_social` e `rw_organization_admin`.
7. No Orbit, use:
   - **Conectar LinkedIn (perfil)** para o perfil pessoal;
   - **Conectar LinkedIn (Página)** para a Página da empresa.

Se a Página ainda não estiver aprovada, o OAuth retorna erro de escopo e a tela
de contas mostra uma mensagem específica. Nesse caso, mantenha o modo manual ou
use o Upload-Post temporariamente.

O LinkedIn recebe a imagem por upload direto (Images API), não por URL pública.

## 6. Worker e cron

O worker é o endpoint `POST /api/social/publish`. Ele exige
`Authorization: Bearer $CRON_SECRET` e só processa quando
`SOCIAL_NATIVE_ENABLED=true` e o tenant tem `publish_mode='provider'`.

A migration `0054` cria a função que agenda o cron a cada minuto:

```sql
select public.configure_social_publish_cron(
  'https://SEU-DOMINIO',
  'SEU_CRON_SECRET'
);
```

- Use exatamente o mesmo `CRON_SECRET` da Vercel.
- A função guarda a URL e o segredo no Supabase Vault e agenda o job
  `social-publish`.
- Se `pg_cron` ou `pg_net` não estiverem habilitados, ative-os em
  **Database > Extensions** e rode a função novamente.
- Se trocar o domínio ou o `CRON_SECRET`, rode a função de novo.

Teste manual do worker:

```bash
curl -X POST https://SEU-DOMINIO/api/social/publish \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{}'
```

## 7. Uso no Orbit

1. Cadastre uma **empresa/cliente** em `/app/clientes` (o compositor exige um
   cliente, mesmo que a conta seja sua).
2. Conecte a conta em `/app/social/contas`.
3. Crie um post em `/app/social`, escolha a conta de destino e defina se exige
   aprovação.
4. Abra o post, anexe uma imagem JPEG (obrigatória para Instagram) e clique em
   **Agendar**.
5. Acompanhe em `/app/social` ou `/app/social/calendario`.
6. Se falhar, o detalhe do post mostra o erro por destino e o botão
   **Tentar novamente**.

Aprovação: o padrão vem de `social_settings.approval_required`. Para desligar
por padrão no seu tenant:

```sql
update public.social_settings
set approval_required = false
where tenant_id = 'SEU_TENANT_ID';
```

## 8. Segurança

- Tokens ficam no **Supabase Vault**; somente o service role acessa.
- O OAuth usa `state` vinculado a usuário e tenant.
- Nenhuma senha de rede social é armazenada ou solicitada.
- O portal do cliente continua lendo posts por RPC `security definer`.
- A publicação exige owner/admin para conectar contas e para ações gerenciais.
- O worker usa lock (`FOR UPDATE SKIP LOCKED`) e idempotência por destino.

## 9. Troubleshooting

| Sintoma                                        | Causa provável                     | Ação                                       |
| ---------------------------------------------- | ---------------------------------- | ------------------------------------------ |
| `not_configured`                               | App ID/secret ausentes             | Preencha as envs e faça deploy             |
| `O app LinkedIn ainda não tem acesso à Página` | Falta Marketing Developer Platform | Solicite acesso ou use o perfil pessoal    |
| `Adicione a conta como tester`                 | Conta não aceitou o convite        | Aceite em Apps e sites no Instagram        |
| `O Instagram exige uma imagem`                 | Post sem mídia                     | Anexe um JPEG no detalhe do post           |
| `Falha ao baixar a imagem`                     | URL não pública/localhost          | Use domínio público ou túnel               |
| Post fica em `publishing`                      | Worker/cron parado                 | Confira o cron, `CRON_SECRET` e os logs    |
| Erro 401/403 do provedor                       | Token expirado/revogado            | Reconecte a conta                          |
| Horário diferente do esperado                  | Fuso do tenant                     | Confira `social_settings.default_timezone` |

## 10. Limitações atuais

- Sem analytics/métricas, IA para legendas, carrossel, Reels, Stories ou
  agendamento recorrente.
- Instagram Standalone não exige Página do Facebook; o LinkedIn exige uma
  Página vinculada ao app na criação.
- App Review da Meta é necessário para publicar em contas de terceiros.
- Testes de RLS cobrem só a restrição de mesmo cliente nos destinos (`tests/rls/isolation.test.ts`); ainda faltam isolamento entre tenants para as tabelas `social_*` e as RPCs do portal.
- O worker processa no máximo `SOCIAL_PUBLISH_BATCH_SIZE` destinos por minuto.

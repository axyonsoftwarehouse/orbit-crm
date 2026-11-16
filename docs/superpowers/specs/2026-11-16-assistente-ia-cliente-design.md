# Assistente de IA do cliente + migração para OpenRouter — design

Data: 2026-11-16

## Intenção

1. **Trocar a OpenAI pelo OpenRouter** como provedor único de IA. Para o
   dono do projeto é mais fácil gerenciar uma chave só e trocar de modelo
   sem mexer em código.
2. **Criar um assistente conversacional na página do cliente**
   (`/app/clientes/[id]`). A ideia nasceu de um "resumo de contato" que foi
   só sugerido na conversa e não existe no código: o assistente substitui
   essa ideia, sem nada prévio a integrar. O usuário do
   CRM conversa com ele sobre aquele cliente, e o assistente pode:
   - responder perguntas sobre o cliente (contatos, projetos, faturas,
     orçamentos, tickets, contratos);
   - **propor** tarefas, criadas só depois da confirmação do usuário;
   - **escrever rascunhos de e-mail**, que o usuário copia ou abre no
     próprio cliente de e-mail.

## Objetivos

- Painel de chat com respostas em streaming na página do cliente.
- A IA busca dados sob demanda via ferramentas, sempre restritas ao tenant
  ativo e ao cliente da página.
- Criação de tarefa com confirmação explícita (cartão de proposta com o
  botão "Criar tarefa").
- Rascunho de e-mail exibido como cartão (destinatário, assunto, corpo),
  com os botões "Copiar" e "Abrir no e-mail" (`mailto:`).
- O resumo de SEO existente passa a usar o OpenRouter.

## Não-objetivos (v1)

- Enviar e-mail pelo CRM (Resend). Fica para depois.
- Salvar o histórico da conversa. A conversa vive só enquanto a página
  está aberta: sem tabela nova, sem migration.
- Assistente em leads, projetos ou em nível global.
- Cota de IA por plano e contabilização de tokens por tenant.
- Editar ou excluir dados existentes pela IA. A única escrita é criar
  tarefa.

## Anti-objetivos (seria falha mesmo funcionando)

- A IA executar qualquer escrita sem clique de confirmação do usuário.
- Vazamento entre tenants ou entre clientes: a IA não pode ler nada fora do
  tenant ativo, nem de outro cliente do mesmo tenant.
- Usar o service role (`admin.ts`) para ler dados para a IA. As leituras
  usam o client SSR com RLS.
- Expor a chave do OpenRouter no navegador.
- Usuário do portal do cliente (`contacts.user_id`) acessar o assistente.

## Restrições do projeto

- Next.js 15 (App Router), Supabase com RLS por `tenant_id`, deploy na
  Vercel. Os Previews usam o banco de produção.
- Server actions e rotas revalidam membership e tenant a cada chamada.
  Nunca confiar em IDs vindos do cliente: o `companyId` recebido é
  revalidado contra o tenant ativo.
- Erros de banco passam por `dbError()`. Os erros da IA viram mensagens
  genéricas em português, com o detalhe só no log (`logger`).
- `tasks.project_id` é obrigatório: toda tarefa pertence a um projeto.
  `projects.company_id` liga o projeto ao cliente.
- O fluxo de criação de tarefa existente (`createTaskAction`) valida com
  `taskSchema`, checa `checkPlanLimit(tenant, "tasks")`, grava
  `created_by` e salva custom fields.
- CI: format, lint, typecheck, unit e build precisam passar.

## Abordagens consideradas

|                   | Abordagem                                                             | Prós                                                                                                                        | Contras                                                                                                     |
| ----------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **A (escolhida)** | Vercel AI SDK (`ai`, `@ai-sdk/react`) + `@openrouter/ai-sdk-provider` | Streaming, `useChat`, ferramentas e o padrão "propor e confirmar" prontos. Encaixa em Next na Vercel. Menos código próprio. | Duas ou três dependências novas                                                                             |
| B                 | `fetch` manual na API do OpenRouter (como o SEO faz hoje)             | Zero dependências, controle total                                                                                           | Teria que escrever o parser de streaming, o laço de ferramentas e o estado do chat: uma versão caseira de A |
| C                 | Sem ferramentas, a IA devolve JSON por mensagem                       | O mais simples                                                                                                              | Contexto inteiro no prompt (estoura com clientes grandes), engessado, difícil de evoluir                    |

O dono escolheu **A**.

## Decisões

### Provedor (OpenRouter)

- Variáveis novas em `src/lib/env.ts` e `.env.example`:
  `OPENROUTER_API_KEY` (opcional, IA desligada se ausente) e
  `OPENROUTER_MODEL` (padrão definido pelo builder, um modelo barato com
  suporte a tool calling).
- Remover `OPENAI_API_KEY` e `OPENAI_MODEL`. Atualizar o `AGENTS.md`
  (seção de variáveis) e lembrar o dono de configurar na Vercel.
- **Privacidade (decisão do dono): só provedores sem retenção.** Toda
  chamada ao OpenRouter, tanto do assistente quanto do resumo de SEO, vai
  com roteamento restrito a provedores que não retêm nem treinam com os
  dados: `provider.data_collection: "deny"` e, se o OpenRouter oferecer,
  Zero Data Retention (`zdr: true`). O builder confirma os nomes exatos dos
  parâmetros na documentação atual do OpenRouter e do
  `@openrouter/ai-sdk-provider`. O modelo padrão tem que ter pelo menos um
  provedor compatível com essa restrição. Essa configuração fica
  centralizada em `src/server/ai/`, para nenhuma chamada escapar dela.
- Módulo único `src/server/ai/` (server-only) que expõe o modelo
  configurado e um erro de domínio (`AiError`). Tanto o resumo de SEO
  quanto o assistente usam esse módulo.
- Resumo de SEO: migrar para `generateText` do AI SDK via esse módulo,
  mantendo prompt, timeout e mensagens de erro equivalentes.

### Assistente: comportamento

- Escopo: um cliente (`companies.id`) por conversa, o da página.
- Quem pode usar: qualquer membro do tenant ativo que consiga ver o
  cliente (mesma regra da página). Usuários do portal ficam de fora.
- Idioma: português do Brasil. Ele não inventa dados: se a ferramenta não
  retornou, diz que não encontrou.
- **Ferramentas de leitura** (executam no servidor, client SSR com RLS,
  filtradas por `tenant_id` e `company_id` revalidados):
  - dados do cliente e contatos;
  - projetos (com status);
  - tarefas abertas dos projetos do cliente;
  - faturas e orçamentos (status, valores, vencimentos);
  - tickets;
  - contratos.
    O builder define a granularidade exata (uma ferramenta por entidade ou
    algumas agrupadas) e limita a quantidade de linhas retornadas.
- **Propor tarefa**: ferramenta _sem execução no servidor_. A IA preenche
  nome, descrição, projeto, prazo e prioridade, e o front renderiza um
  cartão editável mínimo com "Criar tarefa" e "Descartar".
  - Projeto: a IA escolhe entre os projetos do cliente. Se houver mais de
    um candidato plausível, pergunta antes. Se o cliente não tiver projeto,
    avisa e não propõe.
  - Ao confirmar, uma server action cria a tarefa reaproveitando a mesma
    lógica do `createTaskAction` (validação, plan limit, `created_by`,
    revalidate). Antes de inserir, ela revalida que o projeto pertence ao
    tenant **e** ao cliente. O resultado (criada ou erro) volta para a
    conversa.
  - _Decisão do designer:_ tarefas criadas pelo assistente **não** recebem
    custom fields. O `required` dos custom fields só é checado no
    navegador, e exigi-los aqui aumentaria o cartão e mudaria o formulário
    normal. Fica documentado como limitação da v1.
  - _Decisão do designer:_ o status fica no padrão (1). O responsável vem
    por padrão como o próprio usuário que confirma, e o cartão permite
    trocar por outro membro do tenant num select (lista vinda do servidor,
    revalidada na action). A IA não sugere responsável. Notificações seguem
    o que o fluxo normal de criação já faz, sem nada novo.
- **Rascunho de e-mail**: ferramenta sem execução no servidor. A IA gera
  destinatário (um dos contatos do cliente), assunto e corpo, e o front
  mostra o cartão com "Copiar" e "Abrir no e-mail" (`mailto:`). Nada é
  enviado pelo sistema.

### Assistente: infraestrutura

- Rota de streaming (ex.: `src/app/api/ai/cliente/route.ts`) que:
  1. valida o usuário e a membership ativa;
  2. revalida o `companyId` contra o tenant;
  3. aplica rate limit por usuário com `isRateLimited` (bucket por
     `user_id`; o builder escolhe o número, algo como 30 mensagens a cada
     10 minutos). _Decisão do designer:_ para a IA o limite *_falha
     fechado_: se o RPC de rate limit der erro, a mensagem é recusada
     ("Assistente temporariamente indisponível"), porque é a única proteção
     de custo da v1. O `isRateLimited` atual, que falha aberto, continua
     igual para o login; a rota de IA usa um wrapper próprio;
  4. chama `streamText` com o system prompt, as ferramentas e um limite de
     passos de ferramenta.
- Se `OPENROUTER_API_KEY` não estiver configurada, o painel mostra
  "Assistente indisponível" em vez de quebrar.
- UI: painel ou aba "Assistente" na página do cliente, com `useChat`. O
  layout (drawer lateral ou card na página) fica a critério do builder,
  seguindo os componentes shadcn já usados.

### Testes

- Unitários (Vitest): montagem do system prompt; validação dos inputs das
  ferramentas (zod); a action de confirmar tarefa recusa projeto de outro
  cliente ou tenant; o módulo de IA sem chave lança `AiError`.
- Os testes não chamam o OpenRouter de verdade (mock do modelo; o AI SDK
  tem `MockLanguageModel` em `ai/test`).
- Nenhuma mudança de RLS, então `test:rls` só precisa continuar passando.

## Deixado para o builder

- Modelo padrão do OpenRouter, limites de passos e de tokens, timeout.
- Granularidade e formato de retorno das ferramentas de leitura.
- Layout exato do painel e dos cartões.
- Números do rate limit.
- Como compartilhar a lógica de criação de tarefa com `createTaskAction`
  sem duplicar (extrair helper interno, por exemplo).

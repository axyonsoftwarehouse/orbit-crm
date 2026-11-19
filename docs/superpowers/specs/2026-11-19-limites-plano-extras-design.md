# Limites de plano: tags, campos, marcos e storage (item #6)

## Por quê

O item #6 de `docs/mapa/06-problemas-e-dividas.md` registra que tags, campos
personalizados, marcos e storage crescem sem limite de plano. O dono do produto
quer o **mecanismo** pronto para definir os valores depois, como decisão
comercial, na tela de planos (`/plataforma`).

## Decisão (opção A)

- Quatro chaves novas em `plans.limits`: `tags`, `custom_fields`, `milestones`
  e `storage_mb`. Entram na tela de planos pela lista `PLAN_LIMIT_FIELDS`.
- **Sem migration de valores.** As chaves começam ausentes (= ilimitado). Nada
  muda para os tenants até alguém preencher os valores em `/plataforma`.
- Opção B (gravar valores iniciais) descartada por ora: os valores são decisão
  comercial, e o plano gratuito do Supabase tem 1 GB de storage no projeto
  inteiro, o que tornaria valores generosos impossíveis de cumprir.

## Objetivos

- `tags`: total de tags do tenant (a tabela não tem `deleted_at`). Checado em
  `createTagAction` e `createTagForEntityAction`.
- `custom_fields`: total de definições do tenant (sem `deleted_at`). Checado em
  `createCustomFieldAction`.
- `milestones`: marcos não excluídos do tenant, somando todos os projetos.
  Checado em `createMilestoneAction`.
- `storage_mb`: soma de `size_bytes` dos anexos (`attachments`) e das mídias do
  Social (`social_media`) do tenant, mais o arquivo novo, em MB (1 MB =
  1024 × 1024 bytes).
  - **Antes do upload:** os dois uploaders chamam `checkStorageQuotaAction` com
    o tamanho do arquivo e param se o limite estourar.
  - **No registro:** `registerAttachmentAction` e `registerSocialMediaAction`
    leem o tamanho **real** do objeto (`storage.info(path)`), checam de novo e,
    se estourar, removem o objeto e devolvem erro. O `size_bytes` gravado passa
    a ser o real, não o informado pelo navegador.

## Fora do escopo

- Gravar valores nos planos existentes.
- Bloquear upload direto pela API do Storage sem registro. A brecha já existe;
  fechá-la exige policy de Storage com cota e fica para depois.
- Logo de branding (bucket `branding`), que é desprezível.
- Mostrar uso/cota em tela.

## O que não pode acontecer

- Chave ausente ou `null` bloquear alguma coisa.
- Tenant acima de um limite novo perder dados: o limite só barra criação.
- Contagem de `tags`/`custom_fields` filtrar por `deleted_at`. A coluna não
  existe, o filtro falha, a contagem volta vazia e o limite nunca seria
  aplicado. Por isso esses dois usam um escopo novo, `all`.

## Abordagens consideradas

- **Soma do storage por RPC (escolhida):** `tenant_storage_bytes(p_tenant)` em
  SQL (`security invoker`, sujeito ao RLS), migration `0057`. A soma acontece no
  banco.
- Somar no app buscando todas as linhas: cresce com o número de arquivos.
- Agregados do PostgREST (`size_bytes.sum()`): desligados por padrão no Supabase.

## Testes

- `tests/unit/plan-limits.test.ts`: escopo `all` sem filtro de `deleted_at`,
  marcos com filtro, storage bloqueando e liberando (com e sem limite), chave
  ausente.
- Testes das actions: tags, campos, marcos barrados no limite; registro de
  anexo e de mídia usando o tamanho real, removendo o objeto e devolvendo erro
  quando estoura; `checkStorageQuotaAction`.
- RLS: `tenant_storage_bytes` soma só o próprio tenant (outro tenant e anon
  recebem 0 ou erro).

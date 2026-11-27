# Editar post do Social — design (issue #54)

## Por quê

Depois de uma rejeição no portal, a agência só podia reenviar o mesmo texto ou
excluir o post. Falta o ciclo rejeitado → ajustar → reenviar, e a FR-04 da spec
do Social diz que mudança de conteúdo depois de aprovado exige nova aprovação.

## Regras

| Status                                                                  | Editar texto/destinos/mídia | Efeito                                                     |
| ----------------------------------------------------------------------- | --------------------------- | ---------------------------------------------------------- |
| `draft`, `rejected`                                                     | sim                         | status não muda; rejeitado mantém o comentário até reenvio |
| `approved`, `scheduled` sem aprovação exigida                           | sim                         | status e agendamento mantidos                              |
| `approved`, `scheduled` com aprovação exigida                           | sim                         | volta para `draft`, sem agendamento nem aprovação          |
| `pending_approval`                                                      | não                         | o cliente está avaliando                                   |
| `publishing`, `published`, `partially_published`, `failed`, `cancelled` | não                         | —                                                          |

- O cliente do post não muda na edição.
- Mídia segue as mesmas regras; adicionar/remover imagem em post aprovado que
  exige aprovação também volta para rascunho.
- Eventos: `edited` a cada edição; `approval_reset` quando a aprovação é
  desfeita (`metadata.reason`: `edit` ou `media`).

## Abordagens

1. **Volta como rascunho (escolhida pelo usuário).** A agência revisa e clica
   em "Enviar para aprovação"; evita avisar o cliente a cada salvamento.
2. Ir direto para `pending_approval` e avisar o cliente — descartada: várias
   edições seguidas gerariam vários avisos.

## Interface

- Botão "Editar" na página do post (mesmo diálogo do "Novo post", em modo de
  edição), com aviso quando salvar vai desfazer a aprovação.
- Comentário de rejeição em destaque no topo; aviso quando a última alteração
  desfez a aprovação.
- Texto sobre publicação conforme os destinos: automático só para Instagram e
  LinkedIn com publicação nativa ligada; senão, publicação pela agência.

## Implementação

- Regras puras em `src/lib/social-edit.ts`.
- `updateSocialPostAction` grava com guarda de status (`eq status` lido) para
  não sobrescrever uma resposta do cliente feita no meio da edição.
- Sem migration (`social_post_events.event` é texto livre).

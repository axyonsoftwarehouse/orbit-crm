# Especificações de porte do Perfex

> Fase 2 do plano C: pegar as lacunas P0 do [`paridade-perfex-3.4.1.md`](../paridade-perfex-3.4.1.md)
> e traduzir o comportamento do Perfex em decisões prontas para implementar no Orbit.
> Cada documento tem a mesma estrutura: como o Perfex faz (com evidência no código), regras a portar
> (com as correções), proposta de banco/actions/UI, decisões abertas e testes.

| #   | Módulo                            | Documento                                      | Estado                                       |
| --- | --------------------------------- | ---------------------------------------------- | -------------------------------------------- |
| 1   | Notas de crédito                  | [`notas-de-credito.md`](notas-de-credito.md)   | especificação pronta                         |
| 2   | Fatura recorrente                 | [`recorrencia.md`](recorrencia.md)             | especificação pronta                         |
| 3   | Catálogo de itens                 | [`catalogo-de-itens.md`](catalogo-de-itens.md) | especificação pronta                         |
| 4   | Propostas                         | [`propostas.md`](propostas.md)                 | especificação pronta                         |
| 5   | Assinatura eletrônica de contrato | —                                              | pendente (depende das decisões de propostas) |
| 6   | Gateway de pagamento              | —                                              | pendente (entra com "Cobrança automática")   |

## Como ler

1. **§2** é o retrato do Perfex — útil para conferir se a regra foi bem entendida.
2. **§3** é a tabela de decisão: o que portar igual e onde o Perfex está errado.
3. **§4** é a proposta para o Orbit (SQL, actions, telas).
4. **§5** é o que depende de você antes de qualquer código.

## O que já está no roadmap

Os quatro itens entraram na migration `0059_roadmap_paridade_perfex.sql`
(`origin = 'Paridade Perfex 3.4.1'`). A especificação **não** muda o status deles: continua
`backlog` até a implementação começar.

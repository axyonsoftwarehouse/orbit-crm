# Especificações de porte do Perfex

> **Não sabe por onde começar?** Leia [`00-como-usar.md`](00-como-usar.md): mapa dos documentos,
> o que cada um responde e como pedir.
>
> Fase 2 do plano C: pegar as lacunas P0 do [`paridade-perfex-3.4.1.md`](../paridade-perfex-3.4.1.md)
> e traduzir o comportamento do Perfex em decisões prontas para implementar no Orbit.
> Cada documento tem a mesma estrutura: como o Perfex faz (com evidência no código), regras a portar
> (com as correções), proposta de banco/actions/UI, decisões abertas e testes.

| #   | Módulo                            | Documento                                                | Estado               |
| --- | --------------------------------- | -------------------------------------------------------- | -------------------- |
| 1   | Notas de crédito                  | [`notas-de-credito.md`](notas-de-credito.md)             | especificação pronta |
| 2   | Fatura recorrente                 | [`recorrencia.md`](recorrencia.md)                       | especificação pronta |
| 3   | Catálogo de itens                 | [`catalogo-de-itens.md`](catalogo-de-itens.md)           | especificação pronta |
| 4   | Propostas                         | [`propostas.md`](propostas.md)                           | especificação pronta |
| 5   | Assinatura eletrônica de contrato | [`assinatura-de-contrato.md`](assinatura-de-contrato.md) | especificação pronta |
| 6   | Gateway de pagamento              | [`gateway-de-pagamento.md`](gateway-de-pagamento.md)     | especificação pronta |

## Leitura dos addons

Os addons do catálogo não entram nas seis especificações acima. A análise dos cinco que tocam lacunas
do Orbit está em [`addons-relevantes.md`](addons-relevantes.md): o que cada um é de fato (e o que não
é), o modelo de dados e o veredito de porte.

## Como ler

1. **§2** é o retrato do Perfex — útil para conferir se a regra foi bem entendida.
2. **§3** é a tabela de decisão: o que portar igual e onde o Perfex está errado.
3. **§4** é a proposta para o Orbit (SQL, actions, telas).
4. **§5** é o que depende de você antes de qualquer código.

## O que já está no roadmap

Os quatro itens entraram na migration `0059_roadmap_paridade_perfex.sql`
(`origin = 'Paridade Perfex 3.4.1'`). A especificação **não** muda o status deles: continua
`backlog` até a implementação começar.

# Como usar o acervo do Perfex

> Se você (ou um agente) quer responder "o Perfex faz X?", "o Orbit cobre X?", "como portar X?" —
> este é o ponto de entrada. Aponte para esta pasta, mas **diga qual arquivo** e **qual pergunta**.

## 1. O que existe aqui

| Documento                                                                                                                               | Responde                                                                   | Nível         |
| --------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------- |
| [`../paridade-perfex-3.4.1.md`](../paridade-perfex-3.4.1.md)                                                                            | O que o Perfex core 3.4.1 tem, o que o Orbit tem e o que falta (162 itens) | comparação    |
| [`../perfex-addons.md`](../perfex-addons.md)                                                                                            | Quais pacotes de addon existem, por tema (261 pacotes, ~162 produtos)      | índice        |
| [`../perfex-addons-fichas.md`](../perfex-addons-fichas.md)                                                                              | Estrutura de cada produto: menus, tabelas, controllers/rotas               | estrutural    |
| [`addons-relevantes.md`](addons-relevantes.md)                                                                                          | O que Inventory, Deals, Subscription, Mailbox e WhatsApp **fazem**         | funcional     |
| [`00-visao-geral.md`](00-visao-geral.md)                                                                                                | As 6 especificações de porte dos P0                                        | índice        |
| `notas-de-credito.md`, `recorrencia.md`, `catalogo-de-itens.md`, `propostas.md`, `assinatura-de-contrato.md`, `gateway-de-pagamento.md` | Regras do Perfex traduzidas em decisões para o Orbit                       | especificação |

O mapa do Orbit (arquitetura, processos, dados) está em [`../mapa/`](../mapa/01-arquitetura.md) e o
resumo em [`../MAPA_DO_PROJETO.md`](../MAPA_DO_PROJETO.md).

## 2. O que **não** existe aqui

- **O código do Perfex.** Este acervo é o resultado da leitura, não a fonte. Para uma pergunta que
  exija ler o código (regra nova, método específico), é preciso ter a extração.
- **Cobertura funcional dos outros ~157 addons.** Só 5 foram lidos a fundo. Os demais têm ficha
  estrutural (nível 2), não comportamento.
- **Versão diferente de 3.4.1.** Tudo foi lido nessa versão; 3.3.x e 4.x podem divergir.

## 3. A fonte e como recriá-la

O pacote original está em:

```text
C:\Arquivos Importantes\Fontes de Inspiração\fontes\crm\Perfex v3.4.1.rar      (instalação + 9 módulos)
C:\Arquivos Importantes\Fontes de Inspiração\fontes\crm\Perfex CRM.rar          (catálogo de 261 addons)
```

Extração usada (7-Zip), com o resultado em `%TEMP%\opencode\perfex341`:

```powershell
& "C:\Program Files\7-Zip\7z.exe" x "C:\Arquivos Importantes\Fontes de Inspiração\fontes\crm\Perfex v3.4.1.rar" `
  -o"$env:TEMP\opencode\perfex341" "Perfex v3.4.1\perfex crm\*" "Perfex v3.4.1\documentation\*" -y
```

O catálogo de addons foi extraído para `%TEMP%\opencode\cat2` (um diretório por pacote). **Essas
pastas são temporárias**: se tiverem sido apagadas, repita a extração antes de pedir leitura de código.

## 4. Como pedir (exemplos)

Funciona:

> "No acervo do Perfex em `Documentação Projetos\projetos\orbit-crm`, leia
> `perfex/notas-de-credito.md` e implemente a migration inicial no Orbit."

> "Compare a spec `perfex/propostas.md` com o código atual de `src/app/app/orcamentos` e diga o que
> falta para a proposta reutilizar o mesmo editor."

> "No `perfex-addons-fichas.md`, ache quem cria a tabela `mail_*` e depois leia esse addon em
> `%TEMP%\opencode\cat2` para explicar o fluxo de regras."

Não funciona bem:

> "Analise o Perfex." — não diz o que responder nem qual nível.
> "Veja se falta algo." — sem recorte; a resposta vira o relatório de 162 itens de novo.
> "Implemente o Perfex." — 162 produtos, 6 P0; sem escolha, não há escopo.

## 5. Antes de qualquer coisa: segurança

O catálogo é composto de cópias **nulled**. Dois pacotes têm código malicioso confirmado
(`cloudlinkd-perfex-v3` com `eval(base64_decode(...))` e `recruitment` com phpFileManager em
`uploads/`). Leia como texto, **nunca execute**, e não instale em ambiente com dados reais.

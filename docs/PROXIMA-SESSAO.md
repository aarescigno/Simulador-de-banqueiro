# Briefing da próxima sessão

Para começar, basta abrir uma sessão neste repositório e dizer: **"Leia `docs/PROXIMA-SESSAO.md` e execute a próxima etapa."**

## Contexto em 30 segundos

**Agiota S.A.** é um jogo de gestão em turnos, no navegador, sobre como os bancos ganham dinheiro, em tom de sátira seca. O jogador começa como agiota e sobe até conglomerado; o placar é o patrimônio pessoal protegido. Design em [`GDD.md`](GDD.md); ordem de execução em [`ROADMAP.md`](ROADMAP.md); convenções em [`../CLAUDE.md`](../CLAUDE.md); histórico em [`LOG.md`](LOG.md).

## Próxima etapa

**Marco 1a — bolso com 3 compartimentos e retiradas.** Contexto no GDD, seção 6 ("As duas contas"). Plano fechado pelo Opus; números vão para `src/content/params.ts`, bloco novo `pocket`. O caixa é o negócio (empresta, e a busca leva metade); o bolso é o placar. Ainda não há fim de partida: o placar só aparece na aba.

**Compartimentos** (`Compartment = 'own' | 'laranja' | 'offshore'`), em `state.pocket = { own, laranja, offshore, blocked, blockedUntil, doleiro }`:
- **Em seu nome** (`own`): sem custo, sem mínimo. Na busca e apreensão, o saldo inteiro é bloqueado pela Justiça: vai para `blocked`, e `blockedUntil = semana + 12` (nova busca soma ao bloqueado e reinicia o prazo). Quando a semana chega a `blockedUntil`, o bloqueado volta para `own` (evento `unblocked`).
- **Laranja** (`laranja`): o laranja fica com 5% de cada depósito; devolve sem custo. Fora do alcance da busca. Risco: toda semana com saldo, chance de sumir com tudo = `0,02 × (saldo / 50.000)²`, limitada a 0,05 (10 mil → 0,08%/semana; 30 mil → 0,72%; 50 mil → 2%). O laranja é uma pessoa fixa da partida, escolhida por `seed % n` numa lista em `src/content/pocket.ts`: "seu cunhado Wesley" (Wesley), "sua tia Zuleide" (Tia Zuleide), "o Juninho da oficina" (Juninho), "sua comadre Rose" (Rose).
- **Lá fora** (`offshore`): o doleiro cobra 10% na ida e 10% na volta; remessa mínima de R$ 5.000 (a volta não tem mínimo). Fora do alcance da busca e do bloqueio. Risco: depois da primeira remessa (`pocket.doleiro = true`, para sempre), toda semana chance de 0,4% de o doleiro ser preso: atenção policial +25 (o dinheiro fica; o nome aparece na planilha). Evento `doleiroCaught`.
- **Bloqueado** (`blocked`) não se move e não conta como protegido.

**Decisões** (aplicadas na hora, como as de cobrança): `{ type: 'stash', to, amount }` tira do caixa e guarda; `{ type: 'unstash', from, amount }` devolve ao caixa (aporte). `amount` inteiro ≥ 1; erro se passar do caixa (stash) ou do saldo do compartimento (unstash), ou remessa ao exterior abaixo de 5.000. Taxa = `round(amount × taxa)`; o compartimento recebe `amount − taxa` (stash) ou o caixa recebe `amount − taxa` (unstash do exterior). `stats.fees` soma as taxas, `stats.betrayed` o que o laranja levou. Eventos `stashed { to, amount, fee }` e `unstashed { from, amount, fee }`.

**Motor:** `src/engine/pocket.ts` novo com `stash`, `unstash`, `protectedWealth(state)` (= own + laranja + offshore), `betrayChance(saldo)` e `tickPocket(state, rng, events)` (traição, doleiro preso, desbloqueio), chamado no `step` logo depois do `tickPolice`. A busca em `police.ts` passa a bloquear o `own` (evento `ownBlocked { amount, until }`). Toda aleatoriedade pelo `rng` do `step`.

**Parâmetros** (`params.ts`, bloco `pocket`, com comentário em cada um): `laranja { fee: 0.05, betrayScale: 0.02, betrayRef: 50_000, betrayMax: 0.05 }`, `offshore { fee: 0.1, min: 5_000, caughtChance: 0.004, caughtHeat: 25 }`, `block { weeks: 12 }`.

**Estado e save:** `SAVE_VERSION` 5. `GameState.pocket` como acima; `Stats` ganha `fees` e `betrayed`. Migração 4→5: `pocket` zerado (`doleiro: false`, `blockedUntil: 0`), `stats.fees: 0`, `stats.betrayed: 0`.

**Telas e textos** (tudo em `src/content/`; a voz pode ser ajustada, o sentido não):
- Aba **Bolso** (`src/ui/tabs/Pocket.tsx`, troca o Placeholder): no topo, "Protegido" com o total grande e a frase "O caixa trabalha. O bolso é seu. O placar é o que estiver protegido no fim." Se houver bloqueio: "Bloqueado pela Justiça: R$ X · libera na semana N". Um campo de valor só (teclado numérico) com atalhos "+1 mil", "+5 mil", "Todo o caixa" e "Zerar". Três cartões com saldo, frase e os botões "Guardar" e "Tirar" (desabilitados quando não cabem, com o motivo em texto pequeno). Frases: Em seu nome: "Sem custo. Bloqueado se a polícia bater na sua porta."; No nome de {laranja}: "{Curto} fica com 5% de cada depósito. Fora do seu nome, dentro do dele." (para Tia Zuleide e Rose, "dela"); Lá fora: "O doleiro cobra 10% na ida e 10% na volta, mínimo R$ 5.000. A polícia não alcança. O doleiro, às vezes, sim." Com taxa, pedir confirmação: "Guardar R$ X? {Curto} fica com R$ Y." / "Mandar R$ X? O doleiro fica com R$ Y." / "Trazer R$ X? O doleiro fica com R$ Y."
- Resumo: o quadro "Emprestado" vira **Bolso** (total protegido).
- Jornal: guardado em seu nome "R$ X guardados em seu nome."; no laranja "R$ X no nome de {curto}. Ficaram R$ Y de comissão."; lá fora "R$ X com o doleiro. Chegaram R$ Y lá fora."; volta de seu nome "R$ X do bolso de volta ao caixa."; do laranja "{Curto} devolveu R$ X."; de fora "R$ X trazidos de fora. O doleiro ficou com R$ Y."; traição "{Curto} comprou uma caminhonete e trocou de número. Levou R$ X."; doleiro preso "A Polícia Federal prendeu um doleiro na capital. A planilha dele tem apelidos. Um parece o seu."; bloqueio "Bloqueio judicial: R$ X em seu nome congelados até a semana N."; desbloqueio "A Justiça liberou o bloqueio: R$ X de volta em seu nome."
- Painel dev: saldos exatos, bloqueado e prazo, doleiro usado, chance de traição atual.

**Testes do motor** (`tests/bolso.test.ts`): stash e unstash nos três compartimentos com as taxas exatas; erros (mais que o caixa, mais que o saldo, exterior abaixo de 5.000, valor não inteiro ou ≤ 0); `betrayChance` em 0, 10, 30, 50 e 100 mil (teto); traição com rng 0 zera o laranja e soma `stats.betrayed`; doleiro preso só depois da primeira remessa e soma 25 de atenção; busca bloqueia o `own` com o prazo, nova busca soma e reinicia; desbloqueio na semana certa; `protectedWealth` ignora o bloqueado; migração 4→5.

**Sim:** o bot ganha `pocket: Compartment | null` (env `POCKET=own|laranja|offshore`, padrão nenhum): antes de decidir a semana, guarda o caixa acima de R$ 15.000 no compartimento (no exterior, só se o excedente for ≥ 5.000). Colunas novas: protegido médio e bloqueado médio na semana 30; o patrimônio passa a somar protegido + bloqueado. Alvos a 20% a.m., 8 sem, 100 rodadas, semana 30, `INQ=correr`:
1. nada: protegido com `own` ≥ com `laranja` e ≥ com `offshore` (sem polícia, o próprio nome é o mais barato).
2. primo: protegido com `offshore` ≥ 1,1 × com `own` (o bloqueio pesa).
3. padrão: patrimônio com `POCKET=own` entre 85% e 105% do patrimônio sem bolso (guardar protege, não multiplica).

Se errar, ajuste nesta ordem: 1 → taxas do laranja e do doleiro; 2 → `block.weeks` (12 → até 20); 3 → nada no jogo, confira o bot. Anote no log os valores finais e a tabela do sim.

**Estado do balanço depois do PR da polícia** (20% a.m., 8 sem, 100 rodadas, semana 30, `INQ=correr`): nada 31,8 mil · inquérito 0% · busca 0%; padrão 35,1 mil · 38% · 10%; primo 28,3 mil · 86% · 57%. A busca leva metade do caixa (`police.raid.cashShare`), por isso o bolso importa.

**Pronto quando:** `ferramentas/testar.sh --tudo` verde, alvos do sim batidos, aba Bolso usável em 360 px, checkbox marcado.

Modelo: Sonnet, esforço médio — plano fechado, com números, textos, arquivos e alvos do sim.

## Protocolo de toda sessão

1. Conferir a linha **Modelo:** da etapa contra o modelo da sessão (ver `CLAUDE.md`, **Modelo e esforço**). Ler só o necessário: a seção do GDD citada pela etapa e o marco da vez no `ROADMAP.md` (`ferramentas/indice.sh GDD|ROADMAP`) e a entrada mais nova do `LOG.md`.
2. Ver as issues abertas no GitHub. Bug ou ajuste de balanço aberto tem prioridade sobre o roadmap; ideia fica registrada para o marco certo.
3. Executar **um** item do roadmap (a "Próxima etapa" acima), pequeno e jogável. Regra nova do motor ganha teste; mudou o save, sobe `SAVE_VERSION` com migração.
4. Rodar `ferramentas/testar.sh` (com `--tudo` se mexeu em balanço). Conferir a tela em 360 px.
5. No mesmo PR: marcar o checkbox no `ROADMAP.md`, acrescentar a entrada no topo do `LOG.md` (`ferramentas/anota.py`, com a linha **Modelo:** usado) e reescrever a seção "Próxima etapa" deste arquivo para o item seguinte, terminando com a linha **Modelo:**.
6. Abrir o PR para a `main`, esperar o CI passar e fazer o merge. O merge publica no GitHub Pages.
7. Dizer ao dono o que testar no celular e qual é a próxima etapa.

## Critério de pronto de cada etapa

CI verde, merge feito, jogo funcionando no link do Pages, log e briefing atualizados.

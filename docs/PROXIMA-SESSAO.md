# Briefing da próxima sessão

Para começar, basta abrir uma sessão neste repositório e dizer: **"Leia `docs/PROXIMA-SESSAO.md` e execute a próxima etapa."**

## Contexto em 30 segundos

**Agiota S.A.** é um jogo de gestão em turnos, no navegador, sobre como os bancos ganham dinheiro, em tom de sátira seca. O jogador começa como agiota e sobe até conglomerado; o placar é o patrimônio pessoal protegido. Design em [`GDD.md`](GDD.md); ordem de execução em [`ROADMAP.md`](ROADMAP.md); convenções em [`../CLAUDE.md`](../CLAUDE.md); histórico em [`LOG.md`](LOG.md).

## Próxima etapa

**Marco 1a — crise do degrau 1 (advogado, sumir, acordo, entregar) e finais (preso, morto, exilado, aposentado).** Contexto no GDD, seções 9 (Crise e saídas) e 10 (Finais). Plano fechado pelo Opus; números em `src/content/params.ts`, bloco novo `crisis`; textos em `src/content/endings.ts` novo. É o primeiro item que termina a partida. Epílogo completo, "Quem pagou a conta" e herança ficam para o 1c; aqui a tela final é curta.

**Crises** (`state.crisis = { kind, startWeek, weeksLeft, prisonChance } | null`; uma por vez; com crise aberta não abre inquérito nem dilema de ocorrência novo, e chega 1 pedido a menos por semana):
- **Processo** (`kind: 'processo'`): abre quando uma busca e apreensão acontece e (a) `police.raids` passa a ser 2 ou mais, ou (b) a evidência daquela resolução era ≥ 60. A busca aplica os efeitos de sempre; a crise vem junto. `weeksLeft` 6 (julgamento), `prisonChance` 0,7. Dilema `processo` (a primeira opção é a padrão):
  - `nada`: espera o julgamento.
  - `advogado` (12.000): `prisonChance` 0,25.
  - `acordo` (preço `arredonda100(max(8.000, 0,4 × caixa) × 1,5^bribes)`, metade se paga mesada ao delegado): crise acaba na hora, `bribes + 1`, atenção = 40.
  - `entregar` (sem custo): "Entregar o primo". Crise acaba; `state.primoGone = true` (o primo vira pressão para sempre, nas regras e nas exceções); medo × 0,3; atenção = 30.
  - `sumir` (sem custo): "Sumir por uns tempos". Semana + 8 (sem cobrança, sem sorteios); todo empréstimo ativo perdido; pedidos novos; medo 0, boca 30, atenção 0; inquérito, rival, mesada e milícia zerados (bairro novo). Bolso intacto; o bloqueio segue o prazo. Crise acaba.
  - `fugir` (sem custo): "Fugir de vez". Fim **exilado**.
  No julgamento (`weeksLeft` chega a 0): sorteio com `prisonChance` → fim **preso**; senão absolvido: crise acaba, o bloqueado volta para `own`, atenção × 0,5.
- **Jurado** (`kind: 'jurado'`): agendada 4 semanas depois de a milícia ficar `refusedTwice` (recusa ao recado). `weeksLeft` 4. Dilema `jurado`:
  - `ficar`: toda semana, chance 0,15 de fim **morto**; sobrevivendo às 4, a crise acaba e a milícia passa a `paying` com 20%.
  - `pagar` (preço `arredonda100(0,6 × caixa)`): crise acaba, milícia `paying` com 20%.
  - `sumir` e `fugir`: como no processo.

**Finais** (`state.ended = { kind, week, score, parts } | null`; com `ended`, `step` e `decide` lançam erro). Placar e o que entra nele (`parts` guarda cada parcela para a tela):
- **Preso**: laranja + lá fora. Caixa, em seu nome e bloqueado ficam com a Justiça.
- **Morto**: em seu nome + bloqueado + lá fora (a família herda); o laranja fica com o dele.
- **Exilado**: lá fora + metade do caixa (na mala). O resto fica para trás.
- **Aposentado**: decisão nova `retire`, a partir da semana 20 (antes, erro): caixa + em seu nome + laranja + lá fora. A carteira fica na rua; o bloqueado não entra.

**Ordem no `step`:** depois de `tickIncidents`, `tickCrisis` (avança, julga ou mata). Toda aleatoriedade pelo `rng` do `step`. Dilema de crise sem resposta recebe a opção padrão, como os outros.

**Parâmetros** (`params.ts`, bloco `crisis`, com comentário em cada um): `raidsForTrial 2`, `evidenceForTrial 60`, `trialWeeks 6`, `prisonChance 0.7`, `lawyer { cost: 12_000, prisonChance: 0.25 }`, `deal { min: 8_000, cashShare: 0.4, mesadaDiscount: 0.5, heatAfter: 40 }`, `snitch { fearAfter: 0.3, heatAfter: 30 }`, `vanish { weeks: 8 }`, `exile { cashShare: 0.5 }`, `hit { delay: 4, weeks: 4, deathChance: 0.15, payShare: 0.6, militiaRate: 0.2 }`, `retireFromWeek 20`.

**Estado e save:** `SAVE_VERSION` 7. `GameState` ganha `crisis`, `ended` e `primoGone`. Tipos `CrisisKind = 'processo' | 'jurado'`, `Ending = 'preso' | 'morto' | 'exilado' | 'aposentado'`. `DilemmaKind` ganha `'processo' | 'jurado'`. Migração 6→7: `crisis: null`, `ended: null`, `primoGone: false`.

**Telas e textos** (`src/content/endings.ts` e `ui.ts`; a voz pode ser ajustada, o sentido não; morte sempre implícita):
- Dilema `processo`: "Processo" / "O inquérito virou denúncia do Ministério Público. Usura, crime contra o sistema financeiro, lavagem. Julgamento em 6 semanas." Opções: "Esperar o julgamento" ("O juiz decide."), "Contratar advogado · R$ 12.000" ("Bom advogado. Caro por isso."), "Acertar com o delegado · R$ X" ("O processo some. De novo."), "Entregar o primo" ("Ele vai saber quem foi."), "Sumir por uns tempos" ("Oito semanas fora. O caderninho fica."), "Fugir de vez" ("Termina aqui. Leva o que está lá fora.").
- Dilema `jurado`: "Jurado" / "O recado agora veio sem palavras. Faz duas noites que tem um carro parado na frente de casa." Opções: "Ficar" ("Ninguém expulsa você do seu bairro."), "Pagar · R$ X" ("Sessenta por cento do caixa, e 20% de tudo daqui para a frente."), "Sumir por uns tempos", "Fugir de vez".
- Faixa da crise no Resumo, no lugar da do inquérito: "Processo · julgamento em N semanas" (+ " · com advogado") / "Jurado · N semanas".
- Jornal: processo aberto "O Ministério Público ofereceu denúncia. Seu nome está na primeira linha."; advogado "Advogado contratado: R$ 12.000. Disse que já viu piores."; acordo "O processo voltou para a gaveta. Custo: R$ X."; entregar "O primo foi preso de manhã. Você estava em casa."; sumir "Bairro novo. O caderninho começa de novo."; absolvido "Absolvido por falta de provas. A Justiça liberou o bloqueio."; jurado aberto "O carro voltou a parar na frente de casa."; jurado acabou "O carro não voltou. A milícia agora leva 20%."; pagar a milícia "Pago: R$ X. O carro foi embora."
- Políticas e Carteira com `primoGone`: o nível primo aparece desabilitado com "O primo não trabalha mais com você."
- Bolso: no fim da aba, botão "Pendurar o caderninho" (desabilitado antes da semana 20 com "Só depois da semana 20."), confirmação "Encerrar a partida? Você leva o caixa e o bolso; a carteira fica na rua."
- Tela final (`src/ui/EndScreen.tsx`, no lugar do jogo quando `ended`; o "Continuar" do menu leva a ela): título, duas linhas, placar grande, parcelas do placar, "Semanas: N · Emprestado: R$ X · Calote: R$ Y · Denúncias: Z", botão "Nova partida". Textos:
  - Preso: "Preso" / "Usura, crime contra o sistema financeiro e lavagem. O juiz leu a sentença em quatro minutos." / "O que estava em seu nome ficou com a Justiça. O laranja e lá fora, não."
  - Morto: "Fim" / "O velório foi de caixão fechado. O bairro não comentou." / "A família ficou com o que estava no seu nome e lá fora. {laranja} ficou com o resto."
  - Exilado: "Exilado" / "Um ônibus de madrugada, uma mala, um nome novo." / "Metade do caixa na mala. O resto, lá fora."
  - Aposentado: "Aposentado" / "Pendurou o caderninho. A carteira ficou na rua; alguém vai cobrar." / "Levou o caixa e o bolso."

**Testes do motor** (`tests/crise.test.ts`): gatilhos do processo (segunda busca; evidência ≥ 60; primeira busca com evidência baixa não abre); jurado agendado depois do `refusedTwice`; cada opção com efeito exato (custos, `primoGone`, `sumir` com semana + 8, empréstimos perdidos e medidores, `fugir` → exilado); julgamento com rng 0 (preso) e 0,99 (absolvido, bloqueio liberado); jurado: morte com rng 0, sobrevivência às 4 semanas com rng 0,99; placar de cada final; `retire` antes da semana 20 lança erro; `step` e `decide` lançam com `ended`; `levelFor` com `primoGone`; migração 6→7.

**Sim:** `WEEKS` passa a vir do env (padrão 30); o bot responde dilemas de crise com `CRISE=nada|advogado|acordo|entregar|sumir` (padrão `nada`; sem caixa, a padrão); partida encerrada para de avançar. Colunas novas: % com crise, % preso, % morto, % exilado. Alvos a 20% a.m., 8 sem, 100 rodadas, `WEEKS=40`, `INQ=correr`, `INC=padrao`:
1. nada: crise em ≤ 5% das partidas.
2. padrão: crise em 5–20%; preso em 3–15%.
3. primo: crise em ≥ 25%; preso em ≥ 15%.
4. primo com `CRISE=advogado`: preso ≤ 50% do preso com `CRISE=nada`.
5. padrão com `INC=recusa`: morto em 10–40% das partidas.

Se errar, ajuste nesta ordem: 1 a 3 → `evidenceForTrial`, depois `raidsForTrial`, depois `prisonChance`; 4 → `lawyer.prisonChance`; 5 → `hit.deathChance`. Anote no log os valores finais e a tabela do sim.

**Encaixe no código atual:** o jurado é agendado em `state.incidents.scheduled` (id novo `jurado`, só de seguimento) quando a milícia vira `refusedTwice`. `primoGone` entra no mesmo caminho do `primoOut` de `levelFor` (primo vira pressão) e esconde a opção `primo` do dilema `rival`. Custos de crise somam em `stats.spent`. Perder empréstimos no `sumir` usa `loseLoan` de `police.ts`. Opções de crise na tabela `dilemmaOptions` de `incidents.ts` (ou num `crisis.ts` novo que ela importe).

**Estado do balanço depois do PR das ocorrências** (20% a.m., 8 sem, 100 rodadas, semana 30, `INQ=correr`, `INC=padrao`): padrão 28,8 mil · inquérito 42% · busca 7% · tragédia 12%; primo 24,2 mil · 79% · 46% · 18%.

**Pronto quando:** `ferramentas/testar.sh --tudo` verde, alvos do sim batidos, crise e tela final usáveis em 360 px, checkboxes de crise e finais marcados.

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

# Briefing da próxima sessão

Para começar, basta abrir uma sessão neste repositório e dizer: **"Leia `docs/PROXIMA-SESSAO.md` e execute a próxima etapa."**

## Contexto em 30 segundos

**Agiota S.A.** é um jogo de gestão em turnos, no navegador, sobre como os bancos ganham dinheiro, em tom de sátira seca. O jogador começa como agiota e sobe até conglomerado; o placar é o patrimônio pessoal protegido. Design em [`GDD.md`](GDD.md); ordem de execução em [`ROADMAP.md`](ROADMAP.md); convenções em [`../CLAUDE.md`](../CLAUDE.md); histórico em [`LOG.md`](LOG.md).

## Próxima etapa

O Marco 1b, item 2a (ciclo da ESC) foi entregue: fichas de empresas, limite de capital, cobrança em três passos, distribuir e capitalizar. Falta o **2b, as regras que dá para quebrar**. Plano fechado (Opus, 17/11/2026, números de partida para o `sim`).

**Resumo.** Algumas fichas chegam fora das regras da ESC. O jogador pode emprestar assim mesmo, ganha mais, e acumula **fios soltos**, que a Receita e a ação penal vão ler no item 5. Nada de punição nova no 2b, além de a garantia não valer.

**Regras**
- **Ficha irregular** (`generateEscRequests`): depois dos sorteios de hoje, mais um `rng.chance(0,25)`; se verdadeiro, o tipo sai de um `rng.next()`: pessoa física 50%, fora da área 30%, média empresa 20%. Sempre sorteia o tipo antes de aplicar, para a ordem ficar fixa e coberta por teste. Fichas legais não mudam, mas a sequência do RNG muda; é esperado.
- **Tipos** (`LoanRequest.irregular?: 'pf' | 'area' | 'media'`, `Loan.irregular?`):
  - **Pessoa física** (`porte 'pf'`, rótulo "Pessoa física"): `company` com o nome do dono, segmento "Sem CNPJ", faturamento 0, `years` 0, `serasa` do sorteio. Motivo "Abro um MEI amanhã, se precisar."; valor R$ 1–5 mil (múltiplo de 500); risco +0,15; taxa máxima +6; só veículo, com chance 0,2. Sem recebíveis nem equipamento. A alavancagem (`amount / revenue`) não vale para ele.
  - **Fora da área:** porte legal; cidade sorteada em "Porto Lagoão" ou "Lajedo Fundo" (`cityKind: 'distante'`); risco +0,05; taxa máxima +3.
  - **Média empresa** (`porte 'media'`, rótulo "Média empresa"): valor de R$ 20–45 mil, faturamento de R$ 400 mil a R$ 1,5 milhão por mês (múltiplo de 5.000), risco −0,1, veículo com chance 0,8 e recebíveis com 0,9; sem equipamento.
- **No cartão:** aviso âmbar logo abaixo do cabeçalho ("Pessoa física: sem CNPJ.", "Fora da área: {cidade} não faz divisa.", "Média empresa: acima do porte da ESC.") e o botão "Emprestar assim mesmo" no lugar de "Oferecer" (mesma ação).
- **Ao aceitar:** `loan.irregular` = o tipo; `esc.loose += 1`; evento `{ type: 'looseThread', name, kind }`, com a linha do Jornal "Contrato com {nome} registrado como capital de giro de outra empresa. O contador anotou." O contador `esc.loose` aparece no Resumo ("Fios soltos").
- **Execução:** em empréstimo irregular, `executionRecovered` devolve 0 (nem garantia nem penhora): o contrato fora do objeto da ESC não sustenta garantia. O evento `executed` ganha `denied?: true`, e a linha é "{nome}: execução negada. Contrato fora do objeto da ESC. Baixado: {v}." A confirmação de "Executar já" avisa quando o valor é 0. `executionQuote` segue igual ao `execute`.
- **Nota na vida real** (Bolso, `small dim`): "O art. 9 da LC 167/2019 faz do descumprimento do objeto da ESC (capital próprio, porte, município) crime, com reclusão de 1 a 4 anos." Fonte: LC 167/2019.
- **Limite e pagamento:** irregular conta no limite de capital como qualquer outro; no pagamento, vale o mesmo cálculo (o risco já carrega o ajuste).

**Parâmetros** (`src/content/params.ts`, em `escLoans.irregular`, valores de partida)
```ts
irregular: {
  chance: 0.25,
  mix: { pf: 0.5, area: 0.3, media: 0.2 },
  pf: { amount: [1_000, 5_000], risk: 0.15, maxRate: 6, veiculoChance: 0.2 },
  area: { risk: 0.05, maxRate: 3, cities: ['Porto Lagoão', 'Lajedo Fundo'] },
  media: { amount: [20_000, 45_000], revenue: [400_000, 1_500_000], risk: -0.1, veiculoChance: 0.8, recebiveisChance: 0.9 },
},
```

**Estado e save:** `SAVE_VERSION = 10`. `Esc.loose: number`, `Porte` ganha `'pf' | 'media'`, `CityKind` ganha `'distante'`, `LoanRequest.irregular?` e `Loan.irregular?`. Migração 9 → 10: `esc.loose = 0` (só se `esc` não é nulo) e nada nos empréstimos antigos. `GameEvent`: `{ type: 'looseThread'; name; kind }` e `executed.denied?`.

**Código:** `escLoans.ts` (geração, `executionRecovered`, o aceite em `game.ts` marca `irregular` e soma `loose`), `companies.ts` (rótulos e cidades distantes), `content/escLoans.ts` (textos e `escLines`), `RequestCard` (prop `warning?: string` e `lendLabel?: string`), `EscPortfolio`, `EscSummary`, `EscPocket` (nota).

**Sim:** `ESC_IRREG=1` (`escIrregular` no bot) faz o bot aceitar também as irregulares; sem ele, recusa. Colunas novas: `irreg. aceitas` (média por partida) e `calote irreg.` (empréstimos com `irregular`). Regressão: sem `ESC_IRREG`, a saída muda só nas colunas da ESC (a sequência do RNG mudou); as do degrau 1 seguem idênticas. Alvo: com `ESC_IRREG=1`, distribui 10–35% mais que sem, com calote maior nas irregulares. Ajuste: `irregular.chance` (0,15 a 0,4) se o ganho sair fora da faixa; os valores da média empresa se o calote não ficar maior.

**Testes** (`tests/escIrregular.test.ts`): tipo e faixas de cada irregular (determinístico por semente), aceite marca `irregular` e soma `loose`, execução com `recovered` 0 e `denied`, `escLines` do aviso de fio solto e da execução negada, migração 9 → 10, bot com `ESC_IRREG` sem quebrar e sem estourar o limite.

**Telas em 360 px:** pedido irregular (aviso e botão) e empréstimo irregular atrasado com "Executar já" avisando que vale 0. Fluxo manual: painel dev, R$ 40 mil, até a semana 20, abrir a ESC, avançar até aparecer ficha irregular, emprestar, deixar atrasar e executar.

**Docs no mesmo PR:** marcar a linha 2b no `ROADMAP.md`; parágrafo "Como está implementado (Marco 1b, item 2b)" no GDD; entrada no LOG; a "Próxima etapa" passa a ser o item 3 (Selic e economia local), que **começa com "Planejar com o Opus antes"**.

**Para o item 4:** as cartas não repetem estas violações caso a caso. Candidatas: tarifa disfarçada, seguro empurrado no contrato, dinheiro do caderninho como aporte, o primo na cobrança, fábrica de MEI e endereço de fachada em série.

Modelo: Sonnet, esforço médio — plano fechado com números, textos, arquivos e alvos do sim; a execução é código e testes sem decisão de design.

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

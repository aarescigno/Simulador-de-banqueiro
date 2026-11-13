# Briefing da próxima sessão

Para começar, basta abrir uma sessão neste repositório e dizer: **"Leia `docs/PROXIMA-SESSAO.md` e execute a próxima etapa."**

## Contexto em 30 segundos

**Agiota S.A.** é um jogo de gestão em turnos, no navegador, sobre como os bancos ganham dinheiro, em tom de sátira seca. O jogador começa como agiota e sobe até conglomerado; o placar é o patrimônio pessoal protegido. Design em [`GDD.md`](GDD.md); ordem de execução em [`ROADMAP.md`](ROADMAP.md); convenções em [`../CLAUDE.md`](../CLAUDE.md); histórico em [`LOG.md`](LOG.md).

## Próxima etapa

O playtest virtual do Marco 1a foi feito (~17 partidas por bot Playwright em 360 px) e as correções de interface entraram no PR dele. Os achados de balanço que ficam para decisão do dono estão na entrada mais nova do `docs/LOG.md`.

**Marco 1b, item 1 — dilema da lavagem para abrir a ESC.** Plano fechado (Opus, 13/11/2026). Executar sem decidir design; o que ficou em aberto diz como decidir.

**Resumo.** Da semana 20 em diante, o Bolso mostra o painel "Abrir uma ESC". A ESC exige R$ 25 mil de capital declarado, e o jogador escolhe uma de quatro rotas para lavar o dinheiro. Cada rota tem custo, prazo e risco. O dinheiro sai do caixa (no laranja, primeiro do que já está com ele) e fica separado em `state.laundering` até ficar limpo. Pronto o capital, o botão "Abrir a ESC" vende o caderninho a um colega do ramo, manda o resto do caixa para o seu nome e põe a partida no degrau 2 (`state.tier = 2`). Como a ESC ainda não existe, o degrau 2 é uma tela "em breve" (`EscScreen`) que congela o save até o item 2 do 1b. Não é um final. Nesta entrega, só a fachada tem risco imediato (busca durante a lavagem). Os outros riscos ficam gravados (rota e ficha) para a Receita, no item 5.

**Regras**
- **Disponível** (`escAvailable`): `tier === 1`, semana ≥ 20, sem `laundering` em andamento e sem crise aberta. Inquérito aberto não impede a escolha. Uma rota por partida; só a fachada pega na busca libera nova escolha. Não há cancelar.
- **Na semana 20**, o `step` põe o evento `escAvailable` no Jornal. O RNG não é usado.
- **As rotas** (K = capital exigido = 25.000; valores com os parâmetros abaixo):

| rota | sai do caixa na escolha | custo (perdido) | capital pronto | risco agora | risco gravado (item 5) |
|---|---|---|---|---|---|
| consultoria | K + imposto = 31.875 | imposto 27,5% de K = 6.875 → `stats.spent` | semana seguinte | nenhum | Receita: renda sem cliente |
| fachada (lava-rápido) | K + ponto + Simples = 28.500 | 2.000 + 6% de K = 3.500 → `spent` | 6 semanas depois | busca antes de ficar pronto: o capital vai para `pocket.blocked` e a lavagem acaba | Receita: faturamento × movimento |
| laranja de sócio | (K − o que já está com o laranja) + comissão de 5% sobre essa parte + luva de 10% de K | luva 2.500 → `spent`; comissão → `stats.fees` | semana seguinte | nenhum | a ESC é do laranja no papel |
| devagar (MEI) | 0 | 0 | ao juntar K, a R$ 1.500 por semana | nenhum (o caderninho segue aberto) | nenhum |

  - Laranja: `fromLaranja = min(pocket.laranja, K)` sai do bolso do laranja; o resto `R = K − fromLaranja` sai do caixa com comissão `round(R × pocket.laranja.fee)`. Com R$ 10 mil com ele: sai do caixa 15.000 + 750 + 2.500 = 18.250. Com R$ 40 mil: sai 2.500 e ficam 15.000 com ele.
  - Devagar: no fim de cada semana (também com crise aberta), passa `min(1.500, K − capital, caixa)` do caixa para o capital. Ao completar, `readyWeek = semana + 1`.
  - Arredondamento: `Math.round` nos percentuais; a venda do caderninho em `round100`.
- **Pronto**: `laundering.readyWeek !== null` e semana ≥ `readyWeek`. No fim da semana anterior a `readyWeek`, o `step` emite `escReady` (é a mesma semana em que o devagar completa).
- **Abrir a ESC** (`openEsc`): exige pronto, sem crise, sem inquérito aberto e sem dilema pendente (`escOpenBlock` devolve `'notReady' | 'crisis' | 'inquiry' | 'dilemma' | null`). Na abertura:
  1. Venda do caderninho: preço = `round100(Σ ativos: (missedStreak === 0 ? 0,4 : 0,1) × (totalDue − totalPaid))`. Cada ativo vira `status: 'sold'`, com `endWeek`. O preço entra no caixa e em `stats.sold`. `writtenOff` não muda.
  2. Sobra (`leftover`) = o caixa depois da venda. Vai para `pocket.own`. Depois, `cash = K`: o caixa da ESC é o capital.
  3. `state.esc = { openedWeek, capital: K, route, soldLoans, sold, leftover, ficha }`; `tier = 2`; `laundering = null`; `requests = []`. Polícia, ocorrências, fila e bolso ficam como estão; o item 2 decide o que fazer com eles.
  4. A ficha é uma foto do degrau 1: `{ weeks: semana, complaints, raids, bribes, heat: Math.round(heat), primoGone, mesada: incidents.mesada > 0, militia: incidents.militia }`.
- **Com `tier === 2`**, `step` e `decide` lançam `Error('A ESC abre numa próxima versão.')`. `advanceWeeks` e o `playBot` param nesse ponto.
- **Finais com lavagem em andamento** (`endingFor`): o capital separado entra como parcela nova `'esc'` no aposentado (sempre), no preso (só na rota laranja, porque está no nome dele) e no morto (exceto na rota laranja). No exilado, não entra. `sumir` mantém a lavagem.

**Parâmetros** (`src/content/params.ts`, `export const esc`):
```ts
export const esc = {
  fromWeek: 20,
  capital: 25_000,
  consultoria: { tax: 0.275, weeks: 1 },
  fachada: { setup: 2_000, tax: 0.06, weeks: 6 },
  laranja: { signing: 0.1, weeks: 1 },
  devagar: { perWeek: 1_500 },
  sale: { current: 0.4, late: 0.1 },
};
```
De onde vêm os números: no `sim`, o bot padrão (20% a.m., 8 semanas) chega ao pico de caixa (~R$ 27 mil na mediana, R$ 36 mil no p90) umas 8 semanas depois de parar de emprestar. Por isso K = 25 mil. Com 30 mil, a consultoria cai para 5%. Direção real: 27,5% é a alíquota máxima do IR; 6% é a faixa inicial do Simples para serviços; R$ 1.500 por semana é o teto do MEI (R$ 81 mil por ano). São números de jogo e não entram na nota "na vida real".

**Estado e save** (`src/engine/state.ts`, `SAVE_VERSION = 8`)
- Tipos novos: `LaunderRoute = 'consultoria' | 'fachada' | 'laranja' | 'devagar'`; `Laundering { route; startWeek; capital; readyWeek: number | null }`; `Ficha { weeks; complaints; raids; bribes; heat; primoGone; mesada: boolean; militia: MilitiaState }`; `Esc { openedWeek; capital; route; soldLoans; sold; leftover; ficha }`.
- `GameState`: `tier: number` (1 = agiota, 2 = ESC), `laundering: Laundering | null`, `esc: Esc | null`. `Stats.sold: number`. `Loan.status` ganha `'sold'`. `EndingPart` ganha `'esc'`.
- `GameEvent` ganha: `{ type: 'escAvailable' }`, `{ type: 'laundered'; route; cost; who }` (`cost` = custo + comissão; `who` = `laranjaFor(seed).short`), `{ type: 'escReady'; route }`, `{ type: 'fachadaCaught'; amount }`.
- `Decision` ganha `{ type: 'launder'; route }` e `{ type: 'openEsc' }`. Os eventos vão para a fila da semana via `schedule`; `openEsc` não gera evento, porque a tela nova mostra tudo.
- `newGame`: `tier: 1, laundering: null, esc: null, stats.sold: 0`. Migração 7 → 8 em `save.ts`: `({ ...old, tier: 1, laundering: null, esc: null, stats: { ...old.stats, sold: 0 } })`.

**Código**
- `src/engine/esc.ts` (novo; exportar em `index.ts`): `escAvailable`, `launderQuote(state, route) → { outlay, cost, fee, fromLaranja }`, `launder(state, route) → GameEvent` (lança erro se não está disponível ou se o caixa não cobre o `outlay`), `tickEsc(state, events)` (evento da semana 20, transferência do devagar, `escReady`), `catchFachada(state, events)`, `escReady`, `escOpenBlock`, `carteiraSale(state) → { loans, price }`, `openEsc(state)`. Comentários no tom do arquivo `crisis.ts` ("Muta o estado (cópia)").
- `game.ts`: os dois `Decision` novos; guardas de `tier` em `decide`, em `step` e em `advanceWeeks`; `tickEsc` depois de `tickCrisis`, só sem `ended`.
- `police.ts` (`raid`): chamar `catchFachada` logo antes do bloco `const pk = state.pocket`. Com a fachada antes do `readyWeek`, o capital soma em `pk.blocked`, sai o evento `fachadaCaught` e `laundering = null`. O bloco que vem depois já ajusta `blockedUntil` e emite `ownBlocked`.
- `crisis.ts` (`endingFor`): parcela `'esc'` conforme as regras acima.
- `debug.ts`: `degrau: state.tier`, `lavagem: state.laundering ?? 'nenhuma'`, `esc: state.esc ?? 'não'`.
- `src/content/esc.ts` (novo): todos os textos abaixo, mais `escLine(e)` para o Jornal. `journal.ts` chama `escLine` no laço de eventos, como faz com `crisisLine`. `endings.ts`: `partLabels.esc = 'Capital da ESC'`.
- `src/ui/EscPanel.tsx` (novo) no Bolso, entre os compartimentos e "Pendurar o caderninho". Mostra quatro estados: cedo demais, as quatro rotas (cartão com nome, o que é, custo, prazo, risco, "Sai do caixa agora" e o botão Escolher com `window.confirm`), em andamento e pronto (venda, sobra, botão Abrir com `confirm`). Embaixo, a nota "na vida real" (`small dim`).
- `Summary.tsx`: a faixa da lavagem entra na lista `effects`.
- `src/ui/EscScreen.tsx` (novo): no `App.tsx`, `state?.tier === 2` tem prioridade sobre o `Game` (depois do `ended`). Mostra título, linhas, ficha, caixa da ESC, bolso protegido, a frase "em breve" e "Nova partida" com confirmação. Usa as classes da `EndScreen`.
- `Portfolio.tsx`: o status `'sold'` tem o rótulo `ui.portfolio.sold`.

**Textos** (em `src/content/esc.ts`, salvo indicação; `{K}` = `money(esc.capital)`)
- Painel. Título: "Abrir uma ESC". Intro: "Empresa Simples de Crédito: juros livres, contrato, CNPJ. Só empresta capital próprio, declarado. O seu veio do caderninho." Capital: "Capital exigido: {K}." Cedo demais: "A partir da semana {20}." Crise: "Com crise aberta, nenhum contador atende." Saída: "Sai do caixa agora: {v}." Sem caixa: "Caixa não cobre. O que está em seu nome pode voltar para o caixa." Botão: "Escolher". Confirmação: "{rota}: sai {v} do caixa. Não tem volta. Seguir?"
- Consultoria. Nome: "Consultoria". O que é: "Você vira consultor financeiro. Emite nota, recolhe imposto, o dinheiro entra declarado." Custo: "Custo: {v} de imposto de renda ({27,5%})." Prazo: "Prazo: 1 semana." Risco: "Risco: a Receita um dia pergunta quem eram os clientes."
- Fachada. Nome: "Lava-rápido". O que é: "Um lava-rápido numa rua sem movimento. O caixa da loja engole o do caderninho." Custo: "Custo: {v} entre ponto, máquina e Simples." Prazo: "Prazo: {6} semanas, o tempo de o dinheiro passar pela loja." Risco: "Risco: uma busca nesse meio-tempo acha os recibos. Depois, a Receita compara o faturamento com a rua."
- Laranja. Nome: "{short} de sócio". O que é: "A ESC sai no nome de {laranja.name}. Você assina como procurador." Custo: "Custo: {v}, entre a assinatura e a comissão." Prazo: "Prazo: 1 semana." Risco: "Risco: a empresa é {his}. No papel, para sempre." Se `pocket.laranja > 0`: "Usa primeiro o que já está com {short}: {v}."
- Devagar. Nome: "Devagar". O que é: "Um MEI de verdade. Declara toda semana o que um MEI pode faturar, nem um real a mais." Custo: "Custo: nenhum." Prazo: "Prazo: {1.500} por semana, {17} semanas se o caixa deixar." (semanas = `Math.ceil(K / perWeek)`) Risco: "Risco: nenhum no papel. O caderninho segue aberto o tempo todo."
- Em andamento (painel e faixa do Resumo). Consultoria e laranja: "ESC · papéis na junta · semana {w}". Fachada: "Lava-rápido · capital limpo na semana {w}". Devagar: "MEI · {feito} de {K} declarados". Pronto: "ESC pronta para abrir · no Bolso".
- Pronto (painel). "Capital limpo: {K}. A ESC pode abrir." Venda: n = 0: "Nenhum empréstimo na rua. O caderninho fecha zerado."; n = 1: "Um colega do ramo fica com o empréstimo na rua por {v}."; n > 1: "Um colega do ramo fica com os {n} empréstimos na rua por {v}." Depois: "O que sobrar do caixa vai para o seu nome." Botão: "Abrir a ESC". Confirmação: "Abrir a ESC? O caderninho é vendido por {v}. Não tem volta." Bloqueios: inquérito, "Com inquérito aberto, o contador pede para esperar."; dilema, "Decida o que está pendente no Resumo antes."; crise, o texto de crise acima.
- Nota (painel): "Na vida real: a ESC (Lei Complementar 167/2019) só empresta capital próprio, e só a MEI, micro e pequenas empresas do próprio município. Esconder a origem do lucro da agiotagem é lavagem de dinheiro (Lei 9.613/1998), com reclusão de 3 a 10 anos. Empresa de fachada com faturamento inflado e conta de laranja estão entre as tipologias mais comuns; costumam cair no cruzamento de dados fiscais com a movimentação." (Base: referência, seções 12 e 14.)
- Jornal. `escAvailable`: "Um contador do centro deixou um cartão: \"Empresa Simples de Crédito. Juros livres, tudo dentro da lei. Só falta o capital.\"" `laundered` por rota. Consultoria: "Primeira nota de consultoria emitida. Cliente: não informado. Imposto recolhido: {v}." Fachada: "Lava-rápido inaugurado. Custo: {v}. Nenhum carro no primeiro dia. Faturamento recorde." Laranja: "{who} assinou o contrato social sem ler. Custo: {v}." Devagar: "MEI aberto. Atividade declarada: consultoria em gestão." `escReady`. Consultoria e laranja: "Contrato social registrado na junta comercial. A ESC pode abrir." Fachada: "O lava-rápido fechou o caixa no azul. O capital está limpo. A ESC pode abrir." Devagar: "Último boleto do MEI compensado. O capital está limpo. A ESC pode abrir." `fachadaCaught`: "A busca achou os recibos do lava-rápido. {v} foram para o bloqueio judicial."
- Tela "em breve". Título: "ESC aberta". Abertura: "Semana {w}. CNPJ ativo, capital declarado de {K}. A junta comercial não perguntou de onde veio." Origem por rota. Consultoria: "Origem do capital: honorários de consultoria, imposto pago." Fachada: "Origem do capital: lucro de um lava-rápido sem carros." Laranja: "Sócio-administrador: {short}. Você assina como procurador." Devagar: "Origem do capital: faturamento de MEI, declarado semana a semana." Caderninho: n = 0: "O caderninho fechou sem ninguém devendo."; n = 1: "O caderninho foi vendido a um colega do ramo por {v}. Um devedor mudou de credor sem ser avisado."; n > 1: "… por {v}. {n} devedores mudaram de credor sem ser avisados." Sobra (só se > 0): "Sobrou {v} do caixa antigo. Foi para o seu nome." Ficha (título "Ficha"; rótulo · valor): "Semanas de caderninho"; "Denúncias"; "Buscas"; "Propinas"; "Atenção" · faixa de `ui.heat`; "O primo" · "Entregue" ou "Na ativa"; "Mesada do delegado" · "Em dia" ou "Não"; "Milícia" · none "Nunca apareceu", paying "Recebe a parte dela", refused "Recusada", refusedTwice "Recusada duas vezes". Números: "Caixa da ESC" e "Bolso protegido". Fecho: "A ESC abre na próxima versão. Esta partida fica salva até lá." Botão: "Nova partida"; confirmação: "Começar outra partida apaga esta, com ESC e tudo. Continuar?"
- `ui.ts`: `portfolio.sold: 'Vendido a um colega do ramo'`.

**Testes** (`tests/esc.test.ts`, com `fixedRng` e estados montados como em `crise.test.ts`)
1. `escAvailable`: falso na semana 19, verdadeiro na 20, falso com crise, com lavagem em andamento e com `tier` 2.
2. `launderQuote` com os valores exatos da tabela: consultoria 31.875 (custo 6.875); fachada 28.500 (3.500); laranja com 0, com 10.000 e com 40.000 no bolso do laranja (28.750, 18.250 e 2.500); devagar 0.
3. `launder`: efeitos exatos de cada rota em caixa, `spent`, `fees`, `pocket.laranja`, `laundering` e no evento. Lança erro sem caixa, antes da semana 20, com crise e com lavagem em andamento.
4. `step`: `escAvailable` só na semana 20; consultoria escolhida na semana w emite `escReady` no fim de w e abre na w + 1; fachada emite no fim de w + 5; devagar transfere 1.500 por semana (menos, se faltar caixa) e completa em 17 semanas, com `escReady` uma única vez.
5. Busca (`withInquiry` + `fixedRng(0)` + `tickPolice`) com a fachada antes de pronta: capital em `blocked`, `fachadaCaught`, `laundering` nulo. Depois de pronta, a busca não mexe no capital.
6. `openEsc`: preço da venda com um ativo em dia e um atrasado (valor exato), status `'sold'`, `stats.sold`, sobra em `pocket.own`, `cash = K`, `esc` com a ficha completa, `tier` 2, `requests` vazio. Lança erro com cada bloqueio. Depois disso, `step` e `decide` lançam erro.
7. `endingFor` com lavagem: aposentado inclui `'esc'`; preso só na rota laranja; morto exceto na rota laranja; exilado nunca.
8. Bot, sementes 1 a 20, 50 semanas, `ESC` = cada rota: não quebra; vale o invariante `cash + own + laranja + offshore + blocked + betrayed + fees + (laundering?.capital ?? 0) = 20.000 − lent + received + recovered + sold − seized − spent + returned`.
9. Textos: cada rota tem todos os textos e `escLine` cobre os quatro eventos novos.
- `tests/save.test.ts`: as migrações antigas passam a esperar `SAVE_VERSION` em vez de 7; caso novo 7 → 8 (campos novos, e `step` três vezes sem erro).

**Sim**
- `sim/bot.ts`: `BotOptions.esc?: LaunderRoute | null`. Em `botDecide`, depois dos dilemas: se `escOpenBlock(s) === null`, decide `openEsc` e retorna. Se não há lavagem e `escAvailable`: no devagar, lava já; nas outras rotas, lava se `launderQuote(...).outlay ≤ caixa`, ou passa a juntar se `caixa + 0,7 × receivable ≥ outlay`. Com lavagem em andamento que não seja devagar, também junta. Juntando, recusa todos os pedidos. `playBot` para em `tier !== 1`.
- `sim/balance.ts`: `ESC=consultoria|fachada|laranja|devagar` (padrão: nenhuma). Colunas novas: `ESC x%` (`tier === 2`), `sem. ESC` (mediana de `esc.openedWeek`) e `fachada pega x%`.
- **Regressão:** sem `ESC`, a saída do `sim` tem de ser idêntica à de antes do PR, porque nada novo usa o RNG. Rode antes e depois e compare.
- **Alvos** (`WEEKS=40 RATES=20 TERMS=8 RUNS=100`, política padrão, `INC=padrao`, `CRISE=nada`). Medidos no protótipo, 300 rodadas: consultoria 43% (sem. 29), fachada 48% (32, pega 3%), laranja 54% (27), devagar 71% (37).

| ESC | abre | semana mediana |
|---|---|---|
| consultoria | 35–55% | 26–33 |
| fachada | 40–60%, pega 1–8% | 29–36 |
| laranja | 45–65% | 24–30 |
| devagar | 60–80% | 34–40 |

  Ordem que precisa valer: devagar > laranja ≥ fachada ≥ consultoria (com folga de 3 pontos). **Como ajustar:** se uma rota sair da faixa, ajuste só o custo dela (`consultoria.tax` 0,20–0,30; `fachada.setup` 1.000–3.000; `laranja.signing` 0,05–0,15; `devagar.perWeek` 1.200–1.800). Se duas ou mais saírem para o mesmo lado, ajuste `esc.capital` em passos de 1.000, entre 22.000 e 28.000, e mude os textos e testes que citam valores. Registre a tabela final no LOG.

**Docs no mesmo PR:** marcar o item no `ROADMAP.md`; no GDD, seção 16, "Transição 1 → 2", um parágrafo com as regras (K, as quatro rotas, a venda do caderninho, a tela "em breve"); entrada no LOG; e a "Próxima etapa" passa a ser o item 2 do 1b (fichas de pequenas empresas e regras da ESC), começando com "Planejar com o Opus antes". Nela, anotar o que este item deixa: `tier`, `esc`, a trava de `tier` 2 em `step` e `decide`, que o item 2 remove, e a ficha e a rota para a Receita, no item 5.

**Pronto quando:** `ferramentas/testar.sh --tudo` verde; sim dentro dos alvos e idêntico sem `ESC`. Telas conferidas em 360 px (`scrollWidth` 360): o painel nos quatro estados (cedo, rotas, em andamento, pronto), a faixa no Resumo e a `EscScreen` com a rota laranja e com caderninho vendido. Fluxo manual: painel dev, "Dar dinheiro" R$ 40 mil, avançar até a semana 20, consultoria, avançar uma semana, "Abrir a ESC", tela "em breve"; depois, recarregar a página e cair de novo nela.

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

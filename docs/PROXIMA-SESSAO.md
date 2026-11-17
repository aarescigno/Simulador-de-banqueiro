# Briefing da próxima sessão

Para começar, basta abrir uma sessão neste repositório e dizer: **"Leia `docs/PROXIMA-SESSAO.md` e execute a próxima etapa."**

## Contexto em 30 segundos

**Agiota S.A.** é um jogo de gestão em turnos, no navegador, sobre como os bancos ganham dinheiro, em tom de sátira seca. O jogador começa como agiota e sobe até conglomerado; o placar é o patrimônio pessoal protegido. Design em [`GDD.md`](GDD.md); ordem de execução em [`ROADMAP.md`](ROADMAP.md); convenções em [`../CLAUDE.md`](../CLAUDE.md); histórico em [`LOG.md`](LOG.md).

## Próxima etapa

O item 1 do Marco 1b (dilema da lavagem para abrir a ESC) foi entregue. O item 2 foi planejado com o Opus em 17/11/2026 e dividido em duas entregas jogáveis: **2a, o ciclo da ESC** (esta) e **2b, as regras que dá para quebrar** (resumo no fim desta seção). O `ROADMAP.md` já tem as duas linhas.

**Marco 1b, item 2a — O ciclo da ESC: fichas de pequenas empresas, cobrança formal, limite de capital, distribuir e capitalizar.** Plano fechado (Opus, 17/11/2026). Execute sem decidir design; o que ficou em aberto diz como decidir.

**Resumo.** A trava do degrau 2 sai, e a ESC vira jogo. Toda semana chegam de 1 a 3 fichas de MEI, microempresa e pequena empresa da cidade ou de um município vizinho. Cada ficha traz faturamento, anos de CNPJ e nome limpo ou no Serasa. O jogador negocia taxa, prazo e garantia formal (veículo, equipamento ou recebíveis do cartão), como no caderninho. O total na rua não passa do capital declarado: esse é o **limite**. A cobrança tem três passos: ligação do escritório, Serasa e execução na Justiça. O lucro sai da ESC de dois jeitos. **Distribuído**, vai para o bolso e é o placar. **Capitalizado**, aumenta o limite e não sai mais. O que vem do degrau 1 fica no passado: milícia, mesada e ocorrências acabam, a polícia só esfria, e o bolso segue igual. O bolso não volta para a ESC.

**O que fica de fora** (não implementar): pessoa física, média empresa e cliente fora da área (2b); Selic e economia local (item 3); cartas de prática (item 4); Receita, ações judiciais e crise do degrau 2 (item 5). No 2a, todas as fichas são legais.

**Regras**
- **Entrar no degrau 2** (`enterEsc(state)`, em `src/engine/escLoans.ts`): chamada no fim de `openEsc` e na migração 8 → 9 dos saves que já estão em `tier === 2`. Ela faz:
  - `fear = 0`, `word = escLoans.word.start` (30) e `incidents = emptyIncidents()`. A milícia, a mesada, o rival e a agenda acabam: a ESC fica no centro, e eles ficam na periferia. A ficha já guardou tudo.
  - `dilemmas = []`, `police.inquiry = null` e `crisis = null`, por garantia (`openEsc` já exige isso).
  - Gera as primeiras fichas com um RNG derivado, `createRng((state.rngState ^ 0x2c1b3c6d) >>> 0)`, sem mexer no `rngState` (o mesmo padrão do `vanish`).
  - Põe na fila desta semana o evento `{ type: 'escOpened', route, capital, who }` (`who` = `laranjaFor(seed).short`).
- **Limite de capital.** `principalLeft(loan) = Math.round(principal × (totalDue − totalPaid) / totalDue)`, com amortização proporcional. `book` = soma de `principalLeft` dos ativos; no degrau 2, todo ativo é da ESC, porque os do caderninho estão `'sold'`. `headroom = esc.capital − book`. Um pedido só é aceito se `amount ≤ headroom` e `amount ≤ cash`.
- **Lucro.** `distributable = max(0, min(cash, cash + book − esc.capital))`, o que passa do capital.
  - `distribute(to, amount)`: inteiro entre 1 e `distributable`; o offshore tem o mínimo dele. A taxa por compartimento é a mesma do `stash` (`stashFee`). Sai do caixa, vai para o bolso menos a taxa, `stats.fees += fee` e `stats.distributed += amount`. Evento `{ type: 'distributed', to, amount, fee, who }`.
  - `capitalize(amount)`: inteiro entre 1 e `distributable`, `esc.capital += amount`. Evento `{ type: 'capitalized', amount, capital }`. Não tem custo nem volta.
- **Decisões no degrau 2.**
  - Valem: `accept`, `refuse`, `choose`, `retire` e as novas `setEscPolicy`, `execute`, `distribute` e `capitalize`.
  - Lançam erro `'Isso é do caderninho.'`: `setPolicy`, `setOverride`, `forgive`, `stash`, `unstash`, `launder` e `openEsc`.
  - As quatro novas lançam `'Isso é da ESC.'` no degrau 1.
  - Somem as travas `ESC_SOON` de `decide`, `step` e `advanceWeeks`, e a parada `tier === 1` do `playBot`.
- **Aceitar no degrau 2** segue o mesmo fluxo do degrau 1 (contraproposta, paciência, `tolerance`, garantia que o devedor tem).
  - Troca `canAccept` e `validTerms` por `escCanAccept` (caixa e limite) e `escValidTerms` (`escLoans.terms`).
  - Erros: `'Passa do limite de capital.'` antes de `'Caixa insuficiente.'`.
  - `word += escLoans.word.loanMade`.
  - O empréstimo copia `company`. O evento `loanMade` usa `name = company.name`, que é o nome em todos os eventos de empréstimo da ESC.
- **Cobrança da semana** (`collectEsc(state, loan, rng, events)`, só com `tier === 2`; mesma idade e parcelas devidas do `collect`).
  1. O passo vem de `escLevelFor(policy.escCollection, loan)`: o mais alto cujo limiar já chegou em `missedStreak`; sem atraso, nenhum. Guarda em `loan.escLevel`.
  2. Se o passo é `execucao`, executa (abaixo) e encerra; esta semana não tem sorteio.
  3. Se não quebrou: `rng.chance(escHazard(loan))` → `broke`. `escHazard = hazardBase + hazardRisk × risk + hazardRate × (taxa/100)²`.
  4. `pays = rng.chance(escPayChance(loan, level))`.
     - Quebrado: `min(1, (garantia.brokePay ?? payment.brokePay) + level.brokePay)`.
     - Não quebrado: `clamp(base − riskWeight × risk − rateWeight × taxa/100 + garantia.payBonus + level.payBonus, min, 1)`.
  5. Com `serasa`: `word += levels.serasa.word`.
  6. Pagou: igual ao `collect` (`catchUp`, `settled` com `word += escLoans.word.settled`). Os eventos `paid` e `missed` levam `escLevel` em vez de `level`.
  7. Não pagou: `missedStreak += 1`. Ao chegar a `defaultAfterWeeks` (6), vira calote sem execução: `recovered = 0`, todo o saldo é baixa e `word += escLoans.word.defaulted`. O evento `defaulted` vai com `collateral: null`, porque ninguém foi buscar a garantia.
- **Execução** (`execute(state, loan, events)`, pela política ou pela decisão `execute`; a decisão exige ativo e `missedStreak ≥ 1`):
  - `owed = totalDue − totalPaid`.
  - `gross = garantia com recovery > 0 ? min(owed, value × recovery) : owed × execution.penhora`.
  - `recovered = Math.round(gross × execution.net)`.
  - Efeitos: `status: 'defaulted'`, `endWeek`, `loan.recovered`, `cash += recovered`, `stats.recovered += recovered` e `stats.writtenOff += owed − recovered`.
  - `word += execution.word` e evento `{ type: 'executed', name, recovered, writtenOff, collateral }`.
  - O RNG não é usado. `executionQuote(loan)` devolve o mesmo `recovered`, para a confirmação na tela.
- **Fecho da semana com `tier === 2`** (ramo próprio no `step`):
  1. `resolveDefaults`, a fila e os pedidos que expiram, iguais ao degrau 1.
  2. `collectEsc` em cada empréstimo.
  3. `word` anda para `escLoans.word.start` (`drift` 0,05).
  4. `police.heat *= police.decay`. Nada mais da polícia: sem inquérito, sem denúncia, sem atenção pelo boca a boca.
  5. `tickPocket` (desbloqueio, laranja, doleiro).
  6. Sem `tickIncidents`, `tickCrisis` e `tickEsc`.
  7. Jornal, `week += 1` e `requests = generateEscRequests(state, rng)`.
  O medo fica em 0.
- **Fichas** (`generateEscRequests(state, rng)`):
  - **Quantas:** `count = min(maxTotal, rng.int(1, 2) + floor(word / 40 + rng.next()))`.
  - **Empresa:** porte por peso (MEI 45, micro 35, pequena 20) e segmento uniforme. O nome fantasia sai da lista do segmento, sem repetir os que estão em pedidos ou ativos (até 8 tentativas, como no degrau 1).
  - **Dono:** `firstNames`, `surnames` e `titles` de `people.ts`; `profession` = rótulo do segmento.
  - **Cidade:** com chance 0,25, um vizinho sorteado; senão, a sede.
  - **Sinais:** `revenue` = sorteio na faixa do porte, múltiplo de 500; `years = rng.int(0, 12)`; `serasa = rng.chance(0,2)`.
  - **Pedido:** valor sorteado na faixa do porte, múltiplo de 500; motivo sorteado.
  - **Risco:** `raw = next × 0,35 + next × 0,2 + porte.risk + segmento.risk + motivo.risk + (serasa ? 0,15 : 0) + (years < 2 ? 0,08 : 0) + 0,2 × max(0, amount / revenue − 0,5)`. `risk` = `raw` entre 0,02 e 0,95, com 3 casas.
  - **Taxa máxima:** `maxRate = max(1, Math.round(3 + 15 × risk + next × 8))`. Paciência: `rng.int(1, 2)`.
  - **Garantias,** nesta ordem, cada uma com a chance do segmento:
    - veículo: valor entre 8.000 e 30.000, múltiplo de 500;
    - equipamento: valor entre 3.000 e 20.000, múltiplo de 500;
    - recebíveis: valor = `round100(revenue × 0,5)`, o que a maquininha recebe por mês.
  - A ordem dos sorteios fica a critério da execução, mas fixa e coberta por teste.

**Parâmetros** (`src/content/params.ts`)
```ts
// em params.collateral, ao lado das do degrau 1 (brokePay passa a ser opcional em todas)
veiculo: { ratePenalty: 5, payBonus: 0.05, recovery: 0.3, value: [8_000, 30_000] as const },
equipamento: { ratePenalty: 3, payBonus: 0.03, recovery: 0.2, value: [3_000, 20_000] as const },
recebiveis: { ratePenalty: 4, payBonus: 0.1, recovery: 0, brokePay: 0.5, revenueShare: 0.5 },

/** Degrau 2: fichas, termos, pagamento e cobrança da ESC. */
export const escLoans = {
  requests: {
    perWeek: [1, 2] as const, wordDivisor: 40, maxTotal: 5,
    baseRisk: [0.35, 0.2] as const, riskClamp: [0.02, 0.95] as const,
    serasaChance: 0.2, serasaRisk: 0.15, youngYears: 2, youngRisk: 0.08, years: [0, 12] as const,
    /** Pedido grande para o faturamento: soma leverageRisk × max(0, valor/faturamento − leverageFree). */
    leverageRisk: 0.2, leverageFree: 0.5,
    /** Chance de a ficha vir de um município vizinho. */
    neighborChance: 0.25,
  },
  porte: {
    mei: { weight: 45, risk: 0.05, amount: [1_000, 3_500] as const, revenue: [2_000, 6_500] as const },
    micro: { weight: 35, risk: 0, amount: [2_500, 8_000] as const, revenue: [8_000, 30_000] as const },
    pequena: { weight: 20, risk: -0.05, amount: [6_000, 16_000] as const, revenue: [30_000, 120_000] as const },
  },
  terms: {
    rate: { min: 1, max: 30, step: 1, default: 6 },
    weeks: { min: 4, max: 52, step: 1, default: 12 },
  },
  negotiation: { base: 3, riskWeight: 15, spread: 8, patience: [1, 2] as const },
  payment: {
    base: 0.97, riskWeight: 0.3, rateWeight: 0.8, min: 0.05, catchUp: 0.35,
    hazardBase: 0.001, hazardRisk: 0.012, hazardRate: 1.5, brokePay: 0.05, defaultAfterWeeks: 6,
  },
  collection: {
    maxThreshold: 5,
    defaultPolicy: { aviso: 1, serasa: 2, execucao: 4 } as const,
    levels: {
      aviso: { payBonus: 0.06, brokePay: 0, word: 0 },
      serasa: { payBonus: 0.12, brokePay: 0.03, word: -0.3 },
    },
    /** Execução: penhora sem garantia; o advogado e as custas ficam com 1 − net. */
    execution: { penhora: 0.1, net: 0.8, word: -2 },
  },
  word: { start: 30, drift: 0.05, loanMade: 1, settled: 1, defaulted: -1 },
};
```
De onde vêm os números: protótipo em Python do ciclo, 300 sementes, 30 semanas de ESC a partir de R$ 25 mil, com o bot pegando a garantia mais forte e distribuindo o lucro toda semana.

| taxa, prazo | calote | distribuído em 30 sem. | observação |
|---|---|---|---|
| 4%, 12 sem. | 6% | R$ 8,0 mil | |
| 8%, 12 sem. | 11% | R$ 13,2 mil | sem garantia: 18% e R$ 9,7 mil |
| 12%, 12 sem. | 15% | R$ 15,3 mil | daqui para cima, a contraproposta segura a taxa |
| 16%, 12 sem. | 16% | R$ 15,2 mil | juro alto deixou de compensar |
| 8%, 12 sem., capitalizando | 11% | 0 | capital de R$ 25 mil para R$ 41,6 mil |

Política de cobrança (8%, 12 sem.): a padrão (execução na 4ª semana) rende R$ 13,2 mil; sem execução, R$ 11,8 mil; execução na 2ª, R$ 8,8 mil com 27% de calote. Uns 56% dos pedidos não cabem no limite: essa é a pressão do degrau, de propósito. Direção real: garantia baixa a perda, juro alto aumenta o calote, e Serasa e execução recuperam mais, mas custam reputação.

**Estado e save** (`src/engine/state.ts`, `SAVE_VERSION = 9`)
- Tipos novos:
  - `Porte = 'mei' | 'micro' | 'pequena'`;
  - `CityKind = 'sede' | 'vizinho'`;
  - `Company { name; segment: string; porte; city; cityKind; revenue; years; serasa: boolean }`;
  - `EscLevel = 'aviso' | 'serasa' | 'execucao'`;
  - `EscCollectionPolicy = Record<EscLevel, number | null>`.
- `CollateralKind` ganha `'veiculo' | 'equipamento' | 'recebiveis'`.
- `LoanRequest.company?: Company`. `Loan.company?: Company` e `Loan.escLevel?: EscLevel | null`. Nos empréstimos da ESC, `lastLevel` e `override` ficam `null`.
- `Policy.escCollection: EscCollectionPolicy` e `Stats.distributed: number`.
- `GameEvent`:
  - `paid` e `missed` ganham `escLevel?: EscLevel | null`;
  - novos: `{ type: 'escOpened'; route; capital; who }`, `{ type: 'executed'; name; recovered; writtenOff; collateral: CollateralKind | null }`, `{ type: 'distributed'; to: Compartment; amount; fee; who }` e `{ type: 'capitalized'; amount; capital }`.
- `Decision` ganha `{ type: 'setEscPolicy'; collection: EscCollectionPolicy }`, `{ type: 'execute'; loanId }`, `{ type: 'distribute'; to: Compartment; amount }` e `{ type: 'capitalize'; amount }`.
- `newGame`: `policy.escCollection` com a padrão e `stats.distributed: 0`.
- Migração 8 → 9 em `save.ts`: acrescenta os dois campos e, se `tier === 2`, chama `enterEsc` na cópia.

**Código**
- `src/engine/escLoans.ts` (novo; exportar em `index.ts`): `enterEsc`, `generateEscRequests`, `principalLeft`, `escBook`, `escHeadroom`, `escCanAccept`, `escValidTerms`, `distributable`, `distribute`, `capitalize`, `escLevelFor`, `escHazard`, `escPayChance`, `collectEsc`, `execute`, `executionQuote`. Comentários no tom do `crisis.ts`.
- `agiota.ts`: `payChance` passa a ler `params.collateral[kind].brokePay ?? p.brokePay`, em vez do teste `kind === 'inss'`. O resultado do degrau 1 fica idêntico.
- `game.ts`: as guardas por degrau, as quatro decisões novas, o ramo do `step` com `tier === 2` e o fim das travas `ESC_SOON`. `esc.ts`: `openEsc` termina com `enterEsc(state)`.
- `src/content/companies.ts` (novo): `segments`, `escReasons` e `cities`.
- `src/content/escLoans.ts` (novo): os textos de interface do degrau 2 e `escLines(ev)` para o Jornal.
- `journal.ts`:
  - os laços de `paid` e `missed` ignoram eventos com `escLevel` não nulo, que ficam com `escLines`;
  - chamar `escLines` como chama `crisisLine` e `escLine`;
  - a linha de `defaulted` já serve, porque vai com `collateral: null`.
- `collateral.ts`: os três textos novos.
- Interface:
  - `App.tsx`: sai o ramo da `EscScreen`; o degrau 2 usa o `Game`. Apague `EscScreen.tsx` e os textos que só ela usava (`screen.title`, `soon`, `cash`, `protected`, `newGame`, `confirmNew`). `opening`, `origin`, `book`, `leftover`, `ficha*` e `militia` ficam, porque a ficha e o Jornal reaproveitam.
  - `Game.tsx`: com `tier === 2`, cada aba usa a versão da ESC, em `src/ui/esc/`: `EscSummary`, `EscPortfolio`, `EscPolicies` e `EscPocket`. O Jornal é o mesmo.
  - Tire o `RequestCard` do `Portfolio.tsx` para `src/ui/RequestCard.tsx`. Props: `request`, `limits` (os `terms`), `header` (filhos), `canLend`, `noLendLabel`, `onLend` e `onRefuse`. Os últimos termos usados ficam guardados por degrau. O `Portfolio` do degrau 1 passa a usá-lo sem mudar nada na tela.
  - `DevPanel`: com `tier === 2`, esconda os botões de forçar ocorrência e processo.

**Telas do degrau 2**
- **Resumo** (`EscSummary`):
  - Números: "Caixa da ESC" (com o `Spark`), "Capital declarado", "Livre para emprestar" (`headroom`), "Na rua" (`book`), "Em atraso", "Lucro distribuível", "Bolso protegido" (com a nota de bloqueado) e "Baixas".
  - Um medidor, "Reputação" (`word`).
  - Depois: manchete, o botão de pedidos e "Avançar semana", iguais aos do degrau 1. Sem atenção policial e sem faixas.
- **Carteira** (`EscPortfolio`):
  - **Pedidos.** Cabeçalho do `RequestCard`: `Face` do dono, nome da empresa em destaque, "{dono} · {porte}" e a cidade (vizinho com o selo).
  - Chips de sinal: faturamento, anos de CNPJ, e nome limpo ou no Serasa (este em âmbar).
  - O motivo, as garantias com os rótulos novos, sliders de 1 a 30% e de 4 a 52 semanas.
  - Botão: sem limite, "Passa do limite · livre {v}"; sem caixa, o texto atual.
  - **Ativos:** empresa, parcelas (`Installments`), o passo de cobrança, a garantia e, com atraso, "Executar já", confirmado no `ConfirmBar` com o valor de `executionQuote`.
  - **Encerrados:** os carimbos atuais (calote para executado e para calote sem execução).
- **Políticas** (`EscPolicies`): os três passos, com o mesmo controle de semanas do degrau 1.
- **Bolso** (`EscPocket`):
  - os três compartimentos, com os mesmos cartões;
  - "Distribuir lucro", com valor e destino, limitado a `distributable` e com as taxas exibidas;
  - "Capitalizar", com confirmação;
  - a frase de que o bolso não volta;
  - "Fechar a ESC e se aposentar" (`retire`, com confirmação);
  - a ficha do caderninho num `<details>`, com o `Storefront`, as linhas `book` e `leftover` e as linhas da ficha;
  - a nota "na vida real" (`small dim`).

**Textos** (em `src/content/companies.ts` e `src/content/escLoans.ts`; `{v}` = `money`)
- Cidades: sede "São Jurandir do Norte"; vizinhos "Barra do Jurandir" e "Vila Serena". Selo do vizinho: "município vizinho".
- Porte: "MEI", "Microempresa", "Pequena empresa".
- Segmentos (rótulo · nomes · risco · chances de veículo, equipamento e recebíveis):
  - Padaria · Pão de Ouro, Pão Nosso, Trigo Bom, Santa Massa · 0 · 0,2 0,8 0,8
  - Oficina · Auto Center Irmãos, Mecânica Pistão, Oficina do Trevo · 0,03 · 0,5 0,6 0,4
  - Salão de beleza · Studio Bella, Espaço Charme, Salão Divas · 0,05 · 0,1 0,4 0,8
  - Mercadinho · Mercadinho Bom Preço, Mini Box Avenida, Mercearia Central · 0 · 0,4 0,5 0,9
  - Lanchonete · Ponto Certo Lanches, Point do Açaí, Pastelaria Estrela · 0,06 · 0,2 0,7 0,8
  - Confecção · Ateliê Linha Fina, Confecções Aurora · 0,04 · 0,2 0,7 0,3
  - Borracharia · Borracharia 24 Horas, Pneu Forte · 0,05 · 0,6 0,5 0,3
  - Fretes · Fretes Rápido Norte, Mudanças Expresso · 0,04 · 0,9 0,1 0,2
  - Material de construção · Depósito Tijolão, Casa do Construtor · −0,02 · 0,6 0,3 0,7
  - Pet shop · Pet Feliz, Mundo Pet · 0,03 · 0,2 0,3 0,8
- Motivos (texto · risco):
  - "Capital de giro para o fim do ano." · 0
  - "Estoque para a Black Friday." · 0,02
  - "Máquina nova. A velha não dá conta." · −0,03
  - "A folha de pagamento venceu antes do cliente pagar." · 0,12
  - "Cliente grande atrasou o pagamento." · 0,06
  - "Reformar a fachada." · −0,02
  - "Quitar o cheque especial do banco." · 0,15
  - "Abrir uma segunda loja." · 0,05
  - "Imposto atrasado. A Receita mandou carta." · 0,1
  - "Trocar o carro da entrega." · −0,02
  - "O banco cortou o limite." · 0,08
  - "O aluguel do ponto subiu." · 0,06
- Sinais:
  - "Fatura {v} por mês";
  - anos: 0 → "CNPJ deste ano", 1 → "1 ano de CNPJ", n → "{n} anos de CNPJ";
  - "Nome limpo" / "Nome no Serasa".
- Garantias (rótulo · nome · retomada):
  - "Veículo" · "o veículo, em alienação fiduciária" · "Veículo retomado e leiloado";
  - "Equipamento" · "o equipamento" · "Equipamento retomado e leiloado";
  - "Recebíveis do cartão" · "os recebíveis do cartão" · "A maquininha parou de pagar". Este com `perMonth`.
- Passos de cobrança (nome · texto):
  - aviso: "Ligação do escritório" · "Lembrete educado. Ajuda um pouco a pagar.";
  - serasa: "Negativar no Serasa" · "Nome sujo na praça. Ajuda mais a pagar. A reputação da ESC sente um pouco.";
  - execucao: "Execução na Justiça" · "Encerra o contrato. Retoma a garantia ou penhora o que achar. O advogado fica com um quinto. A reputação sente.";
  - dica: "A partir de quantas semanas de atraso cada passo vale. Vale para a carteira toda."
- Resumo: os rótulos acima. Medidor: "Reputação" · "Atrai pedidos. Execução e calote derrubam."
- Carteira:
  - sem limite: "Passa do limite · livre {v}";
  - botão "Executar já"; confirmação: "Executar {nome} na Justiça? Recupera {v}. O resto vira baixa.";
  - passo no empréstimo: "Ligação do escritório", "Nome no Serasa".
- Bolso:
  - "Distribuir lucro"; dica: "Só sai da ESC o que passa do capital declarado."; "Lucro distribuível: {v}."; botão "Para {compartimento}"; sem lucro: "Nada passa do capital agora.";
  - "Capitalizar"; dica: "O lucro vira capital: o limite sobe. Não volta mais para o bolso."; botão "Capitalizar {v}"; confirmação: "Capitalizar {v}? Vira capital declarado. Não sai mais.";
  - "O que está no bolso não volta para a ESC. O capital é declarado; o bolso, não.";
  - "Fechar a ESC e se aposentar"; confirmação: "Fechar a ESC? O caixa vai para você. O que está na rua fica na rua.";
  - título da ficha: "Ficha do caderninho".
- Jornal:
  - `escOpened`: o `screen.opening(semana)` mais o `screen.origin(rota, laranja)`;
  - `executed` com garantia: "{nome}: execução na Justiça. {retomada}: {v}. Baixado: {v}.";
  - `executed` sem garantia que recupere: "{nome}: execução na Justiça. Penhora: {v}. Baixado: {v}.";
  - `distributed`: "Lucro distribuído: {v} {destino}." Destino: own "em seu nome", laranja "no nome de {who}, menos {taxa}", offshore "lá fora, menos {taxa}";
  - `capitalized`: "Capital declarado sobe para {v}. A junta comercial carimbou.";
  - `missed` com serasa: "{nomes} não pagou. Nome no Serasa." (no plural, "não pagaram");
  - `paid` depois do aviso: "{nomes} pagou depois da ligação do escritório.", e depois do Serasa: "{nomes} pagou para limpar o nome." Os dois com " Recebido: {v}.", como no degrau 1.
- Nota (Bolso): "Na vida real: a Empresa Simples de Crédito (Lei Complementar 167/2019) empresta só capital próprio, e o total das operações não pode passar do capital realizado. Atende só MEI, micro e pequenas empresas do município da sede e dos vizinhos. A remuneração é só juros: tarifa é proibida. A Lei da Usura não se aplica, e a garantia pode ser alienação fiduciária. Captar dinheiro de terceiros é proibido."

**Testes** (`tests/escLoans.test.ts`, com `fixedRng` e estados montados como em `esc.test.ts`)
1. `openEsc`: `tier` 2; de 1 a 5 pedidos, todos com `company` válida (porte, cidade sede ou vizinho, sinais nas faixas, valor na faixa do porte); `fear` 0, `word` 30 e `incidents` vazios; `escOpened` na fila; `rngState` igual ao de antes.
2. `generateEscRequests` determinístico com a mesma semente; risco entre 0,02 e 0,95; recebíveis = `round100(revenue × 0,5)`.
3. Aceitar: dentro do limite, ok; acima do limite, lança `'Passa do limite de capital.'`; acima do caixa, lança `'Caixa insuficiente.'`; termos fora de 1–30% e 4–52 semanas, lançam erro; a contraproposta funciona como no degrau 1.
4. Contas exatas: capital 25.000, caixa 10.000, um ativo de principal 20.000, `totalDue` 24.000 e `totalPaid` 6.000.
   - `principalLeft` = 15.000; `headroom` = 10.000; `distributable` = 0.
   - Com caixa 14.000: `distributable` = 4.000.
   - Distribuir 4.000 ao laranja: o laranja fica com 3.800, `fees` 200 e `distributed` 4.000.
   - Capitalizar 4.000 em vez disso: capital 29.000 e `headroom` 14.000.
5. `escPayChance` e `escHazard` com valores exatos, inclusive recebíveis com o devedor quebrado (0,5 + `brokePay` do passo); a política escolhe o passo certo; com serasa, `word` −0,3.
6. Execução pela política no limiar: `recovered` exato com veículo (`round(min(owed, value × 0,3) × 0,8)`) e com recebíveis (penhora: `round(owed × 0,1 × 0,8)`); `status`, `stats`, `word` −2 e o evento. Calote sem execução (política com `execucao: null`), depois de 6 semanas: `recovered` 0 e `defaulted` com `collateral: null`.
7. Decisão `execute`: só com ativo e atrasado; mesmo resultado da política e igual a `executionQuote`.
8. Guardas: as sete decisões do caderninho lançam erro no degrau 2, e as quatro da ESC lançam no degrau 1.
9. `step` no degrau 2, 30 semanas, sementes de 1 a 10, sem doleiro no bolso: nenhum evento de ocorrência, inquérito, denúncia ou crise; `heat` só cai; `fear` fica em 0; o bloqueio do bolso ainda vence (`unblocked`).
10. `retire` no degrau 2: aposentado com caixa e bolso.
11. Bot, sementes de 1 a 20, 70 semanas, `ESC` = cada rota: não quebra e o invariante do item 1 continua valendo (`distribute` só move do caixa para o bolso e para `fees`).
12. Textos: cada segmento tem rótulo, nomes e chances; cada motivo tem texto; `escLines` cobre `escOpened`, `executed`, `distributed` e `capitalized`; `collateralText` tem as seis garantias.
- `tests/esc.test.ts`: o teste de "depois disso, `step` e `decide` lançam erro" passa a conferir que `step` roda. `tests/save.test.ts`: a migração 8 → 9 com save no degrau 1 (só os campos) e no degrau 2 (`enterEsc` aplicada, pedidos gerados e `step` três vezes sem erro).

**Sim**
- `sim/bot.ts`:
  - `BotOptions` ganha `escRate` (padrão 8), `escWeeks` (12), `escMode: 'distribui' | 'capitaliza'` (`distribui`), `escPolicy` (`padrao`, `semexec` = `{1, 2, null}` ou `cedo` = `{1, null, 2}`) e `escCollateral` (padrão sim; ordem: veículo, recebíveis, equipamento).
  - No degrau 2, `botDecide`:
    1. Distribui todo o `distributable` para `pocket ?? 'own'` (respeitando o mínimo do offshore) ou capitaliza tudo.
    2. Aceita cada pedido que cabe (`escCanAccept`), com a contraproposta.
    3. Recusa o resto.
  - Aplica `setEscPolicy` uma vez, ao entrar no degrau 2.
- `sim/balance.ts`: `ESC_RATE`, `ESC_TERM`, `ESC_MODE`, `ESC_POL` e `ESC_GAR=0`. Com `ESC` definido, colunas novas:
  - `ESC calote x%`: empréstimos com `company` e `startWeek ≤ WEEKS − weeks − 6`;
  - `distribuído` e `capital`: medianas de `stats.distributed` e `esc.capital`, só das partidas que abriram;
  - `execuções`: média.
- **Regressão:**
  - sem `ESC`, a saída do `sim` tem de ser idêntica à de antes do PR;
  - com `ESC=laranja`, as colunas do degrau 1 e `ESC x%` / `sem. ESC` também (o RNG derivado não mexe no principal).
  - Rode antes e depois e compare com `diff`.
- **Alvos** (`WEEKS=60 RATES=20 TERMS=8 RUNS=100 ESC=laranja`; a ESC abre perto da semana 28, então são umas 30 semanas de degrau 2):

| caso | ESC calote | distribuído (mediana) |
|---|---|---|
| `ESC_RATE=8` (padrão) | 8–15% | R$ 10–17 mil |
| `ESC_RATE=4` | < 9% | menos que o de 8% |
| `ESC_RATE=16` | ≥ o de 8% + 3 pontos | ≤ 1,3 × o de 8% |
| `ESC_GAR=0` | maior que com garantia | menor que com garantia |
| `ESC_POL=cedo` | maior que o padrão | menor que o padrão |
| `ESC_MODE=capitaliza` | 8–15% | capital (mediana) de R$ 33–48 mil |

  **Como ajustar:**
  - calote fora da faixa: `payment.hazardRate`, de 1,0 a 2,0;
  - distribuído fora da faixa com o calote certo: `negotiation.base`, de 2 a 4;
  - garantia sem diferença: `recovery` do veículo, de 0,25 a 0,4.
  Registre a tabela final no LOG.

**Docs no mesmo PR:**
- marcar a linha 2a no `ROADMAP.md`;
- no GDD, seção 16, "Degrau 2 — ESC", um parágrafo "Como está implementado (Marco 1b, item 2a)" com as regras;
- entrada no LOG;
- a "Próxima etapa" passa a ser o 2b, com o resumo abaixo e a linha **Modelo:**. Se, ao executar, alguma decisão do 2b ficar em aberto, o 2b começa com "Planejar com o Opus antes".

**Pronto quando:**
- `ferramentas/testar.sh --tudo` verde, e o `sim` dentro dos alvos e idêntico sem `ESC`.
- Telas conferidas em 360 px (`scrollWidth` 360): Resumo, Carteira (pedido com veículo, pedido que passa do limite e empréstimo atrasado com "Executar já"), Políticas, Bolso (distribuir, capitalizar e ficha) e Jornal (abertura, execução e distribuição).
- Fluxo manual:
  1. Painel dev, "Dar dinheiro" R$ 40 mil, até a semana 20, consultoria, abrir a ESC.
  2. Aceitar 2 pedidos e avançar 8 semanas.
  3. Distribuir e capitalizar.
  4. Recarregar a página e voltar à mesma tela.

**Depois: item 2b, as regras que dá para quebrar** (decisões tomadas; os números são ponto de partida para o `sim`)
- **Fichas irregulares:** com chance 0,25 por ficha, ela vem irregular: pessoa física 50%, fora da área 30%, média empresa 20%.
  - **Pessoa física:** sem CNPJ, motivo "Abro um MEI amanhã, se precisar."; valor de R$ 1–5 mil; risco +0,15; taxa máxima +6; só veículo, com chance 0,2.
  - **Fora da área:** porte legal, cidade distante ("Porto Lagoão" ou "Lajedo Fundo"); risco +0,05; taxa máxima +3.
  - **Média empresa:** valor de R$ 20–45 mil, faturamento de R$ 400 mil a R$ 1,5 milhão por mês, risco −0,1, veículo com chance 0,8 e recebíveis com 0,9.
- **No cartão:** aviso âmbar ("Pessoa física: sem CNPJ.", "Fora da área: {cidade} não faz divisa.", "Média empresa: acima do porte da ESC.") e o botão "Emprestar assim mesmo".
- **Ao aceitar:** `loan.irregular` = o tipo; `esc.loose += 1` (**fios soltos**, contador visível no Resumo); evento no Jornal: "Contrato com {nome} registrado como capital de giro de outra empresa. O contador anotou."
- **Consequência já no 2b:** o contrato fora do objeto da ESC não sustenta garantia. Na execução, `recovered = 0` ("Execução negada: contrato fora do objeto da ESC."). A Receita e a ação penal leem os fios soltos no item 5.
- **Nota:** "o art. 9 da LC 167/2019 faz do descumprimento do objeto da ESC (capital próprio, porte, município) crime, com reclusão de 1 a 4 anos".
- **Sim:** `ESC_IRREG=1`, o bot também aceita as irregulares. Alvo: distribui 10–35% mais que o legal, com calote maior nas irregulares.
- **Para o item 4:** as cartas não repetem estas violações caso a caso. Candidatas: tarifa disfarçada, seguro empurrado no contrato, dinheiro do caderninho como aporte, o primo na cobrança, fábrica de MEI e endereço de fachada em série.

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

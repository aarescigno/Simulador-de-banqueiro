# Diário de sessões

Registro de cada sessão de trabalho, da mais nova para a mais antiga. Toda sessão acrescenta uma entrada no mesmo PR da entrega, antes do merge, seguindo [`PROXIMA-SESSAO.md`](PROXIMA-SESSAO.md).

Formato de cada entrada: data · item do roadmap · PR; o que foi feito; decisões tomadas; pendências e pontos de balanço para observar; próximo passo; linha **Modelo:** (o usado e por quê). Entrada nova com `python3 ferramentas/anota.py docs/LOG.md`, sem reler o arquivo.

---

## 2026-11-09 · Marco 1a · Crise do degrau 1 e finais · PR #8

**Feito**
- Motor: `src/engine/crisis.ts` novo (`tickCrisis`, `openJurado`, `applyCrisisChoice`, `endingFor`/`endGame`, `retire`, `devForceTrial`). `tickCrisis` roda depois do `tickIncidents`; a crise aberta numa semana só começa a contar na seguinte. `police.ts`: `evidenceOf`, `dealCost`, `openTrial`; o processo abre dentro da busca (segunda busca, ou evidência ≥ 60 na resolução) e, com crise aberta, não há inquérito novo, nem dilema de ocorrência sorteado, e chega 1 pedido a menos. O jurado é agendado `hit.delay` (4) semanas depois da segunda recusa à milícia; só abre se a milícia segue `refusedTwice` e espera uma semana se houver outra crise.
- Dilemas `processo` (nada, advogado, acordo, entregar, sumir, fugir) e `jurado` (ficar, pagar, sumir, fugir) na tabela `dilemmaOptions`; custos congelados na abertura (acordo e pagar saem do caixa da hora; `entregar` some com `primoGone`). `sumir`: semana + 8, empréstimos ativos perdidos, medidores e efeitos zerados, pedidos novos (RNG derivado, sem tocar o `rngState`), tira `jurado` e `milicia_recado` da agenda; bolso intacto.
- Finais `state.ended` (preso, morto, exilado, aposentado) com `parts` para a tela; com `ended`, `step` e `decide` lançam erro; `retire` só da semana 20 em diante. `primoGone` entra no `isPrimoOut` (primo vira pressão) e esconde `primo` no dilema do rival. Save 7, migração 6→7.
- Conteúdo: `src/content/endings.ts` (cartões, linhas do Jornal, faixa, textos e parcelas dos finais), `ui.ts` (retire, primo entregue, painel dev).
- Telas: faixa da crise no Resumo (no lugar da do inquérito), `primoGone` em Políticas e Carteira, "Pendurar o caderninho" no Bolso, `EndScreen.tsx` no lugar do jogo quando `ended` (o "Continuar" leva a ela), "Forçar processo" e jurado (pela lista de ocorrências) no painel dev. `DilemmaCard` passa o preço da opção ao texto. Conferido em 360 px (`scrollWidth` 360): cartão do processo com as 6 opções, faixa com advogado, Bolso antes e depois da semana 20, Políticas com o primo entregue, telas de exilado e aposentado, e o fluxo aposentar pelo Bolso.
- Testes: `tests/crise.test.ts` (gatilhos, cada opção com efeito exato, julgamento com rng 0 e 0,99, jurado, placar de cada final, `retire`, `ended`, `levelFor`, textos, bot) e migração 6→7 em `tests/save.test.ts`. O bot para quando a partida acaba; o invariante de caixa soma o custo da crise via `stats.spent`.
- Sim: `WEEKS`, `CRISE=nada|advogado|acordo|entregar|sumir` e colunas % crise, preso, morto, exilado.

**Decisões**
- Valores que diferem do plano: `lawyer.cost` 8.000 (era 12.000), `lawyer.prisonChance` 0,15 (era 0,25), `hit.deathChance` 0,12 (era 0,15). Com 12 mil o bot quase nunca pagava o advogado (14 de 55 crises; caixa já pela metade depois da busca), então `prisonChance` sozinha não movia o alvo 4 (preso 22-23% mesmo com 0,10); com 8 mil, 0,15 deu 13%. Com 0,15 de morte, o alvo 5 ficava em 40% (no limite).
- Adicionei `lawyer: boolean` em `Crisis` (para a faixa "com advogado"). O acordo não zera o cooldown do inquérito (o plano não pede). O jurado não gera evento `incident`: a abertura é o evento `crisisOpened`.
- Tabela do sim (20% a.m., 8 sem, 100 rodadas, `WEEKS=40`, `INQ=correr`, `INC=padrao`, salvo indicação):

| execução | crise | preso | morto | alvo |
|---|---|---|---|---|
| nada | 0% | 0% | 0% | crise ≤ 5% |
| padrão | 6% | 4% | 0% | crise 5–20%, preso 3–15% |
| primo | 55% | 30% | 0% | crise ≥ 25%, preso ≥ 15% |
| primo, `CRISE=advogado` | 55% | 13% | 0% | preso ≤ 50% de 30% (15%) |
| padrão, `INC=recusa` | 78% | 3% | 35% | morto 10–40% |

- Alvos 2 (crise 6%, preso 4%) e 4 (13% contra 15%) têm pouca folga. Ninguém sai exilado no sim (o bot não escolhe `fugir`).

**Pendências**
- Epílogo completo, "Quem pagou a conta" e herança ficam para o 1c; a tela final é curta.
- Sem faixa no Resumo para o vereador e o choque (de antes).
- O bot não tem `fugir` nem `retire`; o balanço desses finais não é medido.

**Próximo passo**
- Marco 1b: dilema da lavagem para abrir a ESC; planejar com o Opus antes.

Modelo: Opus (plano) + Sonnet, esforço médio (execução) — plano fechado com números e alvos do sim.

---

## 2026-11-09 · Marco 1a · 19 ocorrências · PR #7

**Feito**
- Motor: `src/engine/incidents.ts` novo (16 sorteáveis e 3 de seguimento: gatilhos, `minWeek`, `cooldown`, opções por tipo em `dilemmaOptions`, `tickIncidents`, `applyChoice` despachando por `kind`, `resolveDefaults`, `devForceIncident`). `tickIncidents` roda depois do `tickPocket`: paga mesada e parte da milícia, dispara o agendado, e com chance 0,35 sorteia uma ocorrência pelo peso. Dilema entra para a semana seguinte; sem resposta, o `step` aplica a opção padrão (a primeira da tabela) no começo da semana.
- `police.ts`: `loseLoan` e `addHeat` extraídos, `applyInquiryChoice` (o inquérito entra na mesma tabela), chance de inquérito × 0,4 com mesada e × 0,6 com vereador. `agiota.ts`: `levelFor` ganha `primoOut` (primo vira pressão), rival tira 1 pedido e 8 pontos de taxa máxima, `payChance` aceita `shock`.
- Estado e save 6: `incidents` (`last`, `scheduled`, `mesada`, `militia`, `militiaRate`, `rivalUntil`, `primoOutUntil`, `vereadorUntil`, `shock`), `stats.spent` (mesada, milícia, assalto, cofre e custos de opções) e `stats.returned` (devolução de vereador e PM); migração 5→6. Eventos `incident`, `incidentChoice`, `mesadaFailed`, `militiaCut`.
- Conteúdo: `src/content/incidents.ts` (cartões, linhas do Jornal, notícias, faixas, nomes para o dev); parâmetros no bloco `incidents` de `params.ts`; Jornal em `journal.ts`. Tragédia sempre com a nota do CVV (188).
- Telas: `DilemmaCard` genérico (texto por `kind`, nome e valores interpolados, opção sem caixa desabilitada, opção indisponível some), faixas no Resumo (mesada, milícia, rival, primo fora), painel dev com `ocorrencias` nas variáveis ocultas e "Forçar ocorrência". Conferido em 360 px (`scrollWidth` 360) com três cartões empilhados, as quatro faixas e o Jornal com a tragédia e o CVV.
- Testes: `tests/ocorrencias.test.ts` (53: elegibilidade, cada opção com efeito exato, padrão sem resposta, mesada, milícia, recado, rival em 200 sementes, primo fora, choque, rolar, bem, some, tragédia, cartão, vereador e PM, conteúdo, dev, bot com `paga` e `recusa`, migração). O invariante de caixa do bot soma `spent` e `returned`; o teste de pedidos por semana desconta o rival.
- Sim: `INC=padrao|paga|recusa|0` e colunas de ocorrências por partida, distintas (sorteáveis e total) e tragédia.

**Decisões**
- Os cinco alvos bateram de primeira. Na revisão (Opus), a tragédia passou a exigir o primo (`incidents.tragedia.levels = ['primo']`; antes valia pressão também): saía em 33% das partidas com a política padrão, mais que com o primo. Depois: padrão 12%, primo 18%; patrimônio `INC=padrao` 28,8 mil (81% do `INC=0`).
- Tabela do sim (20% a.m., 8 sem, 100 rodadas, semana 30, `INQ=correr`, sem bolso):

| execução | patrimônio | ocorrências/partida | distintas (sorteáveis) | tragédia |
|---|---|---|---|---|
| `INC=0`, padrão | 35,4 mil | 0 | 0/16 | 0% |
| `INC=padrao`, padrão | 29,1 mil | 9,4 | 15/16 | 33% (12% depois da revisão) |
| `INC=paga`, padrão | 22,7 mil | 9,9 | 15/16 | 27% |
| `INC=recusa`, padrão | 30,4 mil | 10,1 | 15/16 | 34% |
| `INC=padrao`, primo | 24,1 mil | 9,2 | 15/16 | 22% (18% depois da revisão) |

- Alvos: 1) 9,4 ocorrências por partida (7 a 12). 2) 15 de 16 sorteáveis (≥ 14). 3) 29,1 / 35,4 = 82% (80 a 100%). 4) `paga` fica 22% abaixo de `padrao` (máximo +10%). 5) tragédia em 22% das partidas com política primo (≤ 25%). Alvos 3 e 5 têm pouca folga (2 e 3 pontos); uma mudança em `assalto` ou no peso da tragédia mexe neles.
- "Ocorrências por partida" conta todo evento `incident`, seguimentos incluídos. `paga` escolhe a outra opção quando o caixa cobre (na milícia, paga); `recusa` fica na padrão (na milícia, recusa).
- Dilema fica em `state.dilemmas` com `costs` só das opções disponíveis (rival sem `primo` quando o primo está fora) e `amount` congelado para o texto (preço da geladeira, mesada). `DilemmaOption` virou `string` e o `applyChoice` valida contra `costs`. A atenção das ocorrências soma direto em `police.heat` (0 a 100), sem virar denúncia.
- Prazos `...Until` são a primeira semana sem o efeito; as faixas mostram `until − 1`.

**Pendências**
- Com ocorrências, a busca do padrão cai para 7% (o alvo da polícia, 8–25%, era sem ocorrências): o delegado e a rádio mexem na atenção. Olhar no balanço do 1d.
- `LOG.md` passou de 15 KB: as entradas até o PR #5 foram para `docs/LOG-ANTIGO.md`.
- Nenhuma ocorrência termina a partida; milícia recusada duas vezes (`refusedTwice`) e primo fora ainda não têm continuação (item da crise).
- Faixas do Resumo para vereador e choque (gás, décimo) não existem; só os quatro efeitos do plano.

**Próximo passo**
- Crise do degrau 1 e finais.

Modelo: Opus (plano) + Sonnet, esforço médio (execução) — plano fechado com números e alvos do sim.

---

## 2026-11-09 · Marco 1a · Bolso com 3 compartimentos · PR #6

**Feito**
- Motor: `src/engine/pocket.ts` (`stash`, `unstash`, `protectedWealth`, `betrayChance`, `tickPocket`, taxas). Decisões `stash` e `unstash` aplicadas na hora; `tickPocket` roda logo depois do `tickPolice` (desbloqueio, traição do laranja, doleiro preso; sem saldo ou sem doleiro não sorteia nada). A busca em `police.ts` bloqueia o `own` (`ownBlocked`).
- Save versão 5 com migração 4→5 (`pocket` zerado, `stats.fees`, `stats.betrayed`). Eventos `stashed`, `unstashed`, `betrayed`, `doleiroCaught`, `ownBlocked`, `unblocked`; os de laranja carregam `who` (nome curto escolhido por `seed % 4` em `src/content/pocket.ts`).
- Telas: aba Bolso (`src/ui/tabs/Pocket.tsx`, no lugar do Placeholder, que foi removido), quadro "Bolso" no Resumo no lugar de "Emprestado", painel dev com saldos, bloqueio, doleiro e chance de traição. Textos em `ui.ts` e `journal.ts`. Conferido em 360 px (`scrollWidth` 360), com os três compartimentos usados.
- Testes: `tests/bolso.test.ts` (taxas exatas, erros, `betrayChance`, traição, doleiro, bloqueio e desbloqueio, `protectedWealth`), migração em `tests/save.test.ts`. O invariante de caixa do bot em `tests/agiota.test.ts` agora roda com `pocket` e soma bolso, bloqueado, `betrayed` e `fees`.
- Sim: `POCKET=own|laranja|offshore` no bot (guarda o caixa acima de R$ 15.000; exterior só com excedente ≥ 5.000); colunas protegido e bloqueado médios; o patrimônio soma protegido + bloqueado.

**Decisões**
- Único valor que difere do plano: `pocket.block.weeks` 12 → 14. Com 12, o alvo 2 ficou em 1,095× (6,07 mil contra 5,54 mil), um fio abaixo de 1,1×; com 14 passa com folga (1,21×). Taxas e demais números como no plano.
- Tabela do sim (20% a.m., 8 sem, 100 rodadas, semana 30, `INQ=correr`; patrimônio · protegido · bloqueado):

| política | sem bolso | own | laranja | offshore |
|---|---|---|---|---|
| nada | 31,8 mil · 0 | 28,2 mil · 5,0 mil · 0 | 28,6 mil · 4,8 mil · 0 | 28,4 mil · 4,5 mil · 0 |
| padrão | 35,1 mil · 0 | 33,8 mil · 5,4 mil · 0,5 mil | 34,1 mil · 5,3 mil · 0 | 33,3 mil · 4,8 mil · 0 |
| primo | 28,3 mil · 0 | 29,5 mil · 5,0 mil · 3,2 mil | 28,5 mil · 7,5 mil · 0 | 28,1 mil · 6,1 mil · 0 |

- Alvos: 1) nada: protegido own 5,0 mil ≥ laranja 4,8 e offshore 4,5. 2) primo: offshore 6,1 mil = 1,21 × own 5,0. 3) padrão: patrimônio com own 33,8 mil = 96% do sem bolso (85% a 105%).
- No primo o laranja protege mais que o doleiro (7,5 mil contra 6,1): a taxa é metade e, nesse saldo, a chance de traição é pequena. O bolso grande no laranja é que fica caro; vale olhar quando o bot guardar mais.

**Pendências**
- Ainda não há fim de partida: o placar só aparece na aba Bolso e no Resumo.
- O bot guarda tudo acima de R$ 15.000 e por isso empresta menos (patrimônio sem polícia cai 10%); não é política de jogador, só serve de régua.

**Próximo passo**
- Ocorrências: delegado, milícia, rival, devedor some, tragédia implícita.

Modelo: Opus (plano) + Sonnet, esforço médio (execução) — plano fechado com números e alvos do sim.

---

---

## 2026-11-09 · Marco 1a · Atenção policial, inquérito e dilema · PR #6

**Feito**
- Motor: `src/engine/police.ts` (atenção, faixas, `complain` movido de `agiota.ts`, `tickPolice`, inquérito, busca e apreensão, `applyChoice`). Denúncia soma atenção pela origem; inquérito abre por faixa, dura 4 semanas e resolve em arquivo ou busca (caixa, empréstimos `lost`, medo e atenção cortados). Com inquérito aberto chega 1 pedido a menos.
- Dilema genérico (`state.dilemmas`, decisão `choose`): molhar a mão, advogado ou deixar correr, com preço congelado na abertura; sem resposta vale `correr`.
- Save versão 4 com migração 3→4 (`police`, `dilemmas`, `stats.seized`, `heat` nos relatórios); `Loan.status` ganha `lost`.
- Telas: Resumo com três medidores (Atenção só em faixa, com setinha), faixa "Inquérito aberto", `DilemmaCard`, avançar travado com dilema pendente; Carteira mostra "Caderninho apreendido"; Jornal com os textos novos; painel dev mostra atenção, inquérito, propinas e buscas. Conferido em 360 px, sem estourar a largura.
- Testes: `tests/policia.test.ts`, migração em `tests/save.test.ts`, textos em `tests/journal.test.ts`. Invariante de caixa do bot passou a descontar `stats.seized`. Sim com `INQ=correr|advogado|pagar` e colunas atenção, inquérito %, busca %.

**Decisões**
- Valores finais que diferem do plano, ajustados pela ordem do briefing: pesos de denúncia ambiente 8→12, pressão 10→15, celular 10→20, INSS 12→25, moto 18→30, primo 20→30; faixas média 25→20 e alta 55→50. Demais valores como no plano. Os pesos de celular, INSS e moto subiram mais que os de pressão para a garantia (alvo 4) render atenção.
- Alvos do sim (20% a.m., 8 sem, 100 rodadas, semana 30): nada 31,8 mil · inquérito 0% · busca 0% · atenção 8; padrão 35,1 mil · 38% · 10% · 24; primo 28,3 mil · 86% · 57% · 51; padrão com `COLLATERAL=1` 41,5 mil · 48% · 15% · 32; primo com `INQ=advogado` 30,3 mil · 86% · 31% · 52 (busca 54% da do primo sem advogado). Os 6 alvos batem.
- O sorteio de denúncia ambiente agora é uma chamada só a `complain` (muda a sequência do RNG em relação ao save anterior, sem efeito no balanço).

**Pendências**
- A busca do padrão fica perto do piso do alvo (10% contra 8%); olhe ao balancear com mais devedores.
- A prisão e o fim da partida ficam para "Crise do degrau 1"; hoje o inquérito só custa caixa e carteira.

**Próximo passo**
- Bolso com 3 compartimentos e retiradas.

Modelo: Opus (plano) + Sonnet, esforço médio (execução) — plano fechado com números e alvos do sim.

---

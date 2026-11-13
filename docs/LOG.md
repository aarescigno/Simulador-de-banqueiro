# Diário de sessões

Registro de cada sessão de trabalho, da mais nova para a mais antiga. Toda sessão acrescenta uma entrada no mesmo PR da entrega, antes do merge, seguindo [`PROXIMA-SESSAO.md`](PROXIMA-SESSAO.md).

Formato de cada entrada: data · item do roadmap · PR; o que foi feito; decisões tomadas; pendências e pontos de balanço para observar; próximo passo; linha **Modelo:** (o usado e por quê). Entrada nova com `python3 ferramentas/anota.py docs/LOG.md`, sem reler o arquivo.

---

## 2026-11-13 · Marco 1a · Correções do playtest virtual

**Feito**
- Playtest virtual do Marco 1a: ~17 partidas por bot Playwright em 360 px.
- Corrigido: (1) Resumo mostra o valor bloqueado pela Justiça junto do Bolso ("R$ 15 mil bloqueados", `summary.pocketBlocked`); (2) todos os `window.confirm` da interface (Pendurar o caderninho, guardar/trazer no laranja e no offshore, perdoar dívida, nova partida, importar save) viraram confirmação no painel, em dois passos "Confirmar" / "Voltar" (`src/ui/ConfirmBar.tsx`); (3) texto do final preso: "O que ficou com o laranja e lá fora, não."; (4) dilema pendente agora aparece no topo do Resumo, sem mudar a regra; (5) final morto ganhou título "Caixão fechado".
- Fora do escopo e intocados: balanço, sondagem de taxa, botões da tela final, motor, save.

**Pendente de decisão do dono (balanço)**
- (a) Ofertar 100% a.m. e fechar na contraproposta revela o teto do devedor sem custo; estratégia dominante.
- (b) O cauteloso a 12% a.m. se aposenta na semana 20 com menos que o capital inicial.
- (c) Recusar a milícia duas vezes leva ao jurado entre as semanas 13 e 23.
- (d) Ocorrências Pastor, Concorrência, Favor do PM e Rolar a dívida repetem 2 a 3 vezes em 40 semanas.
- (e) Recusa de oferta só aparece no Jornal da semana seguinte.
- (f) A tela final só tem "Nova partida".

**Modelo:** Sonnet, esforço médio — correções de interface já decididas, sem mudança de regra.

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
- Revisão do Opus: o `LOG.md` passou de 15 KB de novo; as entradas do PR #6 foram para `docs/LOG-ANTIGO.md`. O Marco 1a fecha aqui; antes do 1b, vale o dono jogar e abrir issues.

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

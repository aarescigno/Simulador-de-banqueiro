# Briefing da próxima sessão

Para começar, basta abrir uma sessão neste repositório e dizer: **"Leia `docs/PROXIMA-SESSAO.md` e execute a próxima etapa."**

## Contexto em 30 segundos

**Agiota S.A.** é um jogo de gestão em turnos, no navegador, sobre como os bancos ganham dinheiro, em tom de sátira seca. O jogador começa como agiota e sobe até conglomerado; o placar é o patrimônio pessoal protegido. Design em [`GDD.md`](GDD.md); ordem de execução em [`ROADMAP.md`](ROADMAP.md); convenções em [`../CLAUDE.md`](../CLAUDE.md); histórico em [`LOG.md`](LOG.md).

## Próxima etapa

**Marco 1a — atenção policial (faixa), denúncia, investigação.** Contexto no GDD, seções 8 (Indicadores, "Risco visível por sinais indiretos") e 16. Plano fechado pelo Opus; números vão para `src/content/params.ts`, bloco novo `police`. A investigação ainda **não prende nem termina a partida**: custa dinheiro e carteira. Prisão e crise ficam para o item "Crise do degrau 1".

**Atenção** (`state.police.heat`, 0–100, começa em 0, oculta; o jogador vê só a faixa):
- Cada denúncia soma na hora, pela origem: ambiente 8, pressão 10, celular 10, INSS 12, moto 18, primo 20. A função `complain` sai de `agiota.ts` para `src/engine/police.ts` e passa a ser usada também pela denúncia ambiente do `step` (hoje duplicada lá).
- Fim de toda semana, depois de medo e boca a boca: `atenção = atenção × 0,92 + max(0, boca − 50) × 0,04`, limitada a 0–100.
- Faixas (`heatBand`): baixa < 25 ≤ média < 55 ≤ alta. Quando a faixa sobe na semana (comparando o começo do `step` com o fim), sai o evento `heatRose { band }` no Jornal.

**Inquérito.** No fim da semana, sem inquérito aberto e com `semana ≥ police.cooldownUntil`, abre um com chance por faixa: baixa 0, média 4%, alta 12%. Abrir cria `police.inquiry = { startWeek, weeksLeft: 4, lawyer: false, complaints: 0 }`, o evento `inquiryOpened` e um **dilema** para a semana seguinte (abaixo). A cada `step` seguinte, `weeksLeft − 1`; ao chegar a 0, resolve. Denúncia com inquérito aberto soma 1 em `inquiry.complaints`. Enquanto o inquérito corre, chega 1 pedido a menos por semana (mínimo 0).

**Resolução:** `evidência = atenção + 10 × inquiry.complaints`; com advogado, `× 0,5`. `chance de busca = clamp((evidência − 10) / 80, 0,05, 0,9)`.
- **Arquivado:** atenção × 0,7; evento `inquiryArchived`.
- **Busca e apreensão:** leva `round(caixa × 0,5)` do caixa (`stats.seized` novo); empréstimo ativo com cartão do INSS retido vai junto sempre (o cartão é prova); cada outro empréstimo ativo se perde com chance 0,35. Perdido = `status: 'lost'` novo, `endWeek`, o saldo (`totalDue − totalPaid`) vai para `stats.writtenOff`. Medo × 0,5, atenção × 0,5, `police.raids + 1`. Evento `raid { seized, lost: nomes }`.
- Os dois: `inquiry = null`, `cooldownUntil = semana + 6`.

**Dilema** (mecanismo novo e genérico; os eventos do item seguinte vão reusar): `state.dilemmas: Dilemma[]`, com `Dilemma = { id (de nextId), kind: 'inquerito', week, costs }`; `costs` é o preço de cada opção, congelado na abertura. Decisão nova `{ type: 'choose', dilemmaId, option }`; opção inválida ou caixa menor que o custo lançam erro. Dilema sem resposta quando a semana fecha recebe a opção padrão (`correr`) no começo do `step`. Opções do inquérito:
- `pagar` (molhar a mão): custa `arredonda100(max(1.500, 0,2 × caixa) × 1,5^police.bribes)`. Fecha o inquérito na hora, `bribes + 1`, `cooldownUntil = semana + 6`. A atenção **não** muda (as denúncias continuam). Evento `bribed { amount }`.
- `advogado`: custa 3.000. `inquiry.lawyer = true`. Evento `lawyerHired { amount }`.
- `correr`: sem custo, sem evento.

**Estado e save:** `SAVE_VERSION` 4. `GameState` ganha `police: { heat, inquiry, cooldownUntil, bribes, raids }` e `dilemmas`; `Loan.status` ganha `'lost'`; `Stats` ganha `seized`; `WeekReport` ganha `heat`. Tipos `HeatBand = 'baixa' | 'media' | 'alta'`, `Inquiry`, `Police`, `Dilemma`, `DilemmaKind`, `DilemmaOption = 'pagar' | 'advogado' | 'correr'`. Migração 3→4: `police` zerado (`heat 0`, `inquiry null`, `cooldownUntil 0`, `bribes 0`, `raids 0`), `dilemmas: []`, `stats.seized: 0`, `heat: 0` nos relatórios do jornal.

**Ordem no `step`:** decisões → dilemas sem resposta recebem o padrão → fila e pedidos expirados → cobrança (denúncias somam atenção) → denúncia ambiente → medo e boca → `tickPolice` (atenção, `heatRose`, avanço ou resolução do inquérito, ou sorteio de um novo; inquérito aberto nesta semana não avança) → jornal (com `heat`) → semana + 1 → pedidos (−1 com inquérito aberto). Toda aleatoriedade pelo `rng` do `step`.

**Parâmetros** (`params.ts`, bloco `police`, com comentário em cada um): `decay 0.92`, `complaint {…}` por origem, `wordFloor 50`, `wordWeight 0.04`, `bands { medium: 25, high: 55 }`, `inquiryChance { baixa: 0, media: 0.04, alta: 0.12 }`, `cooldown 6`, `inquiry { weeks: 4, perComplaint: 10, lawyerFactor: 0.5, raidOffset: 10, raidScale: 80, raidMin: 0.05, raidMax: 0.9, requestPenalty: 1 }`, `bribe { min: 1_500, cashShare: 0.2, growth: 1.5 }`, `lawyer 3_000`, `raid { cashShare: 0.5, loanLoss: 0.35, heatAfter: 0.5, fearAfter: 0.5 }`, `archived { heatAfter: 0.7 }`.

**Telas e textos** (tudo em `src/content/`; a voz pode ser ajustada, o sentido não):
- Resumo: terceiro medidor, **Atenção**, mostra só a faixa (Baixa / Média / Alta, em verde / âmbar / vermelho) e setinha quando a faixa mudou desde a semana anterior; texto "Denúncia vira atenção. Atenção vira inquérito." Os três medidores cabem lado a lado em 360 px (ajustar `.meters` no CSS se precisar). Com inquérito aberto, faixa abaixo dos medidores: "Inquérito aberto · faltam N semanas" (+ " · com advogado").
- Dilema: componente novo `src/ui/DilemmaCard.tsx`, no Resumo acima do recorte do Jornal. Título "Inquérito"; corpo "A delegacia abriu inquérito por usura. O escrivão deu a entender que papel às vezes some." Botões com o custo: "Molhar a mão · R$ X" ("O inquérito some. A atenção fica, e o preço sobe."), "Contratar advogado · R$ 3.000" ("N semanas de inquérito, com defesa."), "Deixar correr" ("N semanas. Depende do que acharem."). Opção que o caixa não cobre fica desabilitada ("Caixa não cobre."). Com dilema pendente, o botão de avançar fica desabilitado com o texto "Decida antes de avançar."
- Jornal: `heatRose` média "A ronda passou duas vezes na sua rua esta semana."; alta "Viatura parada na esquina. Ninguém desceu."; `inquiryOpened` "Inquérito aberto na delegacia, por usura. Seu nome está nele."; `bribed` "Um papel sumiu na delegacia. Custo: R$ X."; `lawyerHired` "Advogado contratado: R$ X. Pediu que você não falasse com ninguém."; `inquiryArchived` "Inquérito arquivado. Falta de provas."; `raid` "Busca e apreensão às seis da manhã. Levaram R$ X do caixa." e, se houve perda, "O caderninho foi junto: {nomes} não paga(m) mais."
- Carteira: encerrado com `lost` mostra "Caderninho apreendido · baixado R$ X".
- Painel dev: atenção exata, inquérito (semanas, advogado, denúncias), propinas e buscas.

**Testes do motor** (`tests/policia.test.ts`, com o `fixedRng` de `tests/cobranca.test.ts`): `heatBand` nos limites (24,9 / 25 / 54,9 / 55); denúncia soma o peso da origem e conta no inquérito aberto; decaimento e termo do boca a boca (boca 80 → +1,2); baixa nunca abre inquérito; média com rng 0 abre inquérito e dilema com o preço congelado; cooldown e "um por vez" respeitados; `pagar` desconta, fecha, `bribes + 1` e o próximo preço sai × 1,5; `pagar` sem caixa lança erro; `advogado` desconta e marca; dilema sem resposta vira `correr`; resolução depois de 4 semanas com rng 0 (busca: caixa, INSS sempre perdido, outros com 0,35, medo, atenção, `raids`, `stats.seized`) e com rng 0,99 (arquivado); advogado reduz a chance de busca; −1 pedido com inquérito aberto (média em 200 sementes); migração 3→4.

**Sim:** o bot ganha a opção `inquiry: 'correr' | 'advogado' | 'pagar'` (env `INQ`, padrão `correr`; sem caixa para a opção, corre). Colunas novas: atenção média na semana 30, % de partidas com inquérito e % com busca (contar `inquiryOpened` e `raid` no jornal). Alvos a 20% a.m., 8 sem, 100 rodadas, semana 30, `INQ=correr`:
1. nada: inquérito em ≤ 10% das partidas.
2. padrão: inquérito em 25–50%; busca em 8–25%.
3. primo: inquérito em ≥ 70%; busca em ≥ 35%.
4. padrão com `COLLATERAL=1`: inquérito pelo menos 5 pontos acima do padrão sem garantia.
5. Patrimônio: padrão ≥ nada × 1,05; primo < padrão (o primo deixa de compensar sem cuidado).
6. primo com `INQ=advogado`: busca ≤ 70% da busca do primo com `correr`.

Se errar, ajuste nesta ordem: 1 → `wordFloor` e `wordWeight`; 2 a 4 → pesos das denúncias, depois as faixas, depois `inquiryChance`; 5 → `raid.cashShare` e `raid.loanLoss`; 6 → `lawyerFactor`. Anote no log os valores finais e a tabela do sim.

**Pronto quando:** `ferramentas/testar.sh --tudo` verde, alvos do sim batidos, Resumo com dilema e três medidores usável em 360 px, checkbox marcado.

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

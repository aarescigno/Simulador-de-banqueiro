# Diário de sessões

Registro de cada sessão de trabalho, da mais nova para a mais antiga. Toda sessão acrescenta uma entrada no mesmo PR da entrega, antes do merge, seguindo [`PROXIMA-SESSAO.md`](PROXIMA-SESSAO.md).

Formato de cada entrada: data · item do roadmap · PR; o que foi feito; decisões tomadas; pendências e pontos de balanço para observar; próximo passo; linha **Modelo:** (o usado e por quê). Entrada nova com `python3 ferramentas/anota.py docs/LOG.md`, sem reler o arquivo.

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

## 2026-11-08 · Marco 1a · Cobrança em 3 níveis, medo e boca a boca · PR #5

**Feito**
- Política de cobrança (conversa, pressão, primo) com limiar por nível e exceção por devedor; `levelFor`, efeitos dentro de `collect`, `forgive`; decisões `setPolicy`, `setOverride`, `forgive`.
- Medo e boca a boca no estado, com decaimento; pedidos por semana leem o boca a boca e o risco de quem pede lê o medo; denúncias como contador e eventos no Jornal.
- Save versão 3 com migração 2→3; `defaultAfterWeeks` 4→6; `WeekReport` ganha `fear` e `word`.
- Telas: Políticas (seletor por nível), Carteira (nível da semana, chips Regra/Conversa/Pressão/Primo, Perdoar com confirmação), Resumo (medo e boca com setinha), painel dev. Conferido em 360 px.
- Testes do motor (`tests/cobranca.test.ts`, migração) e `sim` com `POLICY=nada|conversa|padrao|primo` e colunas de medo, boca e denúncias.

**Decisões**
- Medo fixado no começo da semana (`collect` recebe `fear`), para a ordem dos devedores não importar.
- Valores finais que diferem do plano, ajustados pela ordem do briefing: `perWeek` divisor 40→50 (boca a boca de quem não cobra disparava para 85); pressão: medo +1, boca −0,5; primo: pagar +0,42, pagar se quebrou +0,18, medo +2,8; celular tomado: boca −3, denúncia 10%; moto tomada: boca −8, denúncia 30%; cartão do INSS: boca −4 ao fechar, denúncia 2% por semana. `inss.payBonus` e `inss.brokePay` ficaram como estavam.
- Alvos do sim (20% a.m., 8 sem, 100 rodadas, semana 30), sem garantia: nada 30,8 mil · medo 0 · boca 80 · denúncias 0,0; padrão 38,0 mil · 37 · 24 · 2,8; primo 38,1 mil · 74 · 2 · 7,8. Com garantia: nada 39,4 mil; padrão 43,7 mil (+15%) · medo 35 · boca 12 · denúncias 4,0; primo 44,2 mil. Alvos 1–5 batidos; primo só 0,3% acima do padrão e medo do primo em 74 (teto 75): folga curta.

**Pendências**
- Balanço fino com o jogo na mão: o boca a boca do primo fica em ~2 (piso); observe se "não vem ninguém" frustra.
- A denúncia ainda é só contador; a atenção policial é o próximo item.

**Próximo passo**
- Planejar com o Opus a atenção policial (faixa), denúncia e investigação.

Modelo: Sonnet, esforço médio — plano fechado, com números e alvos do sim.

---

## 2026-11-08 · Marco 1a · Plano da cobrança, medo e boca a boca · PR #4

**Feito**
- Fechados os números da política de cobrança no briefing: efeito de cada nível (pagamento, quebra, medo, boca a boca, denúncia), medo e boca a boca como indicadores 0–100 com decaimento, custo das garantias, perdão, formato do save 3, telas, textos, testes e alvos do `sim`. Sem código.

**Decisões**
- Medo e boca a boca puxam em sentidos opostos: medo faz todo mundo pagar e afasta quem tem opção; boca a boca traz pedidos (e, no próximo item, atenção). Violência sobe o medo e derruba o boca a boca.
- `defaultAfterWeeks` sobe de 4 para 6, para a regra padrão (conversa 1ª, pressão 2ª, primo 4ª) ter vez.
- Denúncia só acumula num contador; a faixa de atenção policial é o próximo item.
- Garantia deixa de dominar: alvo de no máximo +20% de patrimônio (hoje +40%), com custo em boca a boca e denúncia.

**Próximo passo**
- Executar o plano da "Próxima etapa" com o Sonnet.

Modelo: Opus, esforço alto — planejamento de balanço (a regra pede Opus, médio ou alto).

---

## 2026-11-02 · Fluxo de trabalho · Kit de economia de sessões · PR #3

**Feito**
- Incorporado o kit neutro, adaptado ao fluxo que já existia: `ROADMAP.md`, `LOG.md`, `PROXIMA-SESSAO.md` e as issues continuam sendo a fonte. Os docs paralelos do kit (`PLANO`, `PROPOSTAS`, `RESUMO`, `entregas/`) não entraram, para não duplicar.
- `ferramentas/`: `testar.sh` + `testes.txt` (typecheck, lint, testes e build, uma linha cada; `--tudo` roda o `sim`), `indice.sh` (seções dos docs com as linhas), `mapa.sh` (funções do código), `anota.py` (entrada no topo do log sem reler) e `arquiva.py` (mover seções entre docs).
- `.claude/settings.json` bloqueia o Read de `node_modules`, `dist`, `dev-dist`, `coverage` e lockfile.
- `CLAUDE.md` ganhou **Economia** e **Modelo e esforço** (Opus planeja, Sonnet/Haiku executam; conferência de abertura). O protocolo do briefing deixa de mandar ler o GDD inteiro: lê só a seção da etapa.
- `docs/ENXUGAR.md`: roteiro para quando os docs incharem.

**Decisões**
- A "Próxima etapa" termina com a linha **Modelo:**. O Marco 1a (cobrança) ainda tem números em aberto: fica "planejar com o Opus antes".
- O CI segue com os passos separados (log mais claro); o `testar.sh` é para as sessões.

**Próximo passo**
- Sessão curta com o Opus para fechar os números da cobrança no briefing; depois o Sonnet executa.

Modelo: Opus — mudança de processo e decisão de como encaixar o kit.

---

## 2026-10-24 · Marco 1a · Garantias e negociação nos pedidos · PR #2

**Feito**
- Cada pedido traz os bens do devedor: celular (todos), moto (entregador quase sempre, demais às vezes), cartão do INSS (só aposentado).
- O jogador escolhe a garantia na ficha (ou nenhuma) e oferece taxa e prazo.
- Negociação: cada devedor tem uma taxa máxima oculta, que sobe com o risco (quem está desesperado topa qualquer coisa; quem tem opção pechincha). Exigir garantia baixa essa taxa. Oferta acima vira contraproposta ("A 35% eu fecho."), com botão para fechar nela; sem paciência (1 a 2 contrapropostas), o devedor vai pedir a outro e sai no Jornal.
- Efeito das garantias: aumentam a chance de pagar; no calote, celular e moto são vendidos com deságio e abatem a perda (nunca além do que falta); o cartão do INSS faz pagar mesmo depois de o devedor quebrar, mas no calote o banco bloqueia o cartão e não rende nada.
- Save versão 2 com migração da 1. Painel dev mostra taxa máxima e paciência.
- Bot do `sim/` negocia (topa contraproposta) e pode exigir garantia (`COLLATERAL=1 npm run sim`).

**Decisões**
- Parâmetros em `src/content/params.ts` (`negotiation`, `collateral`); textos em `src/content/collateral.ts`, `ui.ts` e `journal.ts`.
- A contraproposta é sempre a taxa máxima que o devedor topa com a garantia escolhida: negociar revela o teto.

**Para observar**
- Balanço: hoje exigir garantia sempre compensa (no sim, a 20% a.m. em 8 semanas, patrimônio médio em 30 semanas sobe de ~27 mil para ~39 mil). O custo da garantia (medo, boca a boca, denúncia, BO de moto tomada) entra no próximo item.
- Reter cartão do INSS é crime (Estatuto da Pessoa Idosa, art. 104). Nota "na vida real" fica para o item de notas do Marco 1c.

**Próximo passo**
- Marco 1a: política de cobrança em 3 níveis com exceções por devedor; medo e boca a boca.

---

## 2026-10-24 · Marco 0 · Fundação + primeiro loop · PR #1

**Feito**
- Scaffold Vite + TypeScript + Preact, ESLint/Prettier, Vitest, CI (typecheck, lint, testes, build) e deploy no GitHub Pages.
- PWA com aviso de nova versão; motor puro com RNG de semente, fila de eventos e save versionado; autosave e exportar/importar.
- Casca mobile: menu, aviso de conteúdo (CVV 188), cinco abas, tema terminal; painel dev com 10 toques na versão.
- Primeiro loop do agiota: pedidos semanais, taxa e prazo, parcelas, calote após 4 semanas, Jornal semanal; bot joga 50 semanas nos testes.
- Modelos de issue: bug, ajuste de balanço, ideia.

**Próximo passo**
- Marco 1a: garantias e negociação nos pedidos.

# Briefing da próxima sessão

Para começar, basta abrir uma sessão neste repositório e dizer: **"Leia `docs/PROXIMA-SESSAO.md` e execute a próxima etapa."**

## Contexto em 30 segundos

**Agiota S.A.** é um jogo de gestão em turnos, no navegador, sobre como os bancos ganham dinheiro, em tom de sátira seca. O jogador começa como agiota e sobe até conglomerado; o placar é o patrimônio pessoal protegido. Design em [`GDD.md`](GDD.md); ordem de execução em [`ROADMAP.md`](ROADMAP.md); convenções em [`../CLAUDE.md`](../CLAUDE.md); histórico em [`LOG.md`](LOG.md).

## Próxima etapa

O item 1 do Marco 1b (dilema da lavagem para abrir a ESC) foi entregue; ver a entrada mais nova do `docs/LOG.md`.

**Marco 1b, item 2 — Fichas de pequenas empresas; regras da ESC (município, capital próprio, porte).** Planejar com o Opus antes de executar: esta etapa ainda não tem plano fechado.

**O que já existe no código**
- `state.tier` (1 = agiota, 2 = ESC) e `state.esc` (`openedWeek`, `capital`, `route`, `soldLoans`, `sold`, `leftover`, `ficha`). `EscScreen` é a tela "em breve" e `App.tsx` a prioriza quando `tier === 2`.
- Trava: `step` e `decide` lançam `Error('A ESC abre numa próxima versão.')` com `tier === 2`; `advanceWeeks` e `playBot` param nesse ponto. O item 2 remove essa trava.
- Ao abrir: `cash = esc.capital`; o resto do caixa antigo foi para `pocket.own`; `requests` vazio; polícia, ocorrências, fila e bolso seguem como estavam (o item 2 decide o que fazer com eles: inquérito, milícia, mesada, primo).
- `esc.route` e `esc.ficha` ficam gravados para a Receita (item 5): consultoria = renda sem cliente; fachada = faturamento x movimento; laranja = a ESC é do laranja no papel.
- `sim`: `ESC=rota` já abre a ESC no bot; `playBot` para em `tier !== 1`.

**O que o plano precisa fechar**
- O ciclo semanal do degrau 2: quem pede crédito (fichas de pequenas empresas: MEI, micro, pequena), como a ficha é gerada e o que o jogador vê.
- Regras da ESC: só empresta capital próprio (limite = capital declarado), só no município, só a MEI, micro e pequena empresa; o que acontece ao violar cada uma.
- Taxa, prazo e inadimplência do degrau 2 e o que muda em relação ao agiota; o que fazer com o bolso e a polícia herdados.
- Texto, parâmetros, testes, alvos do `sim` e critério de pronto, no formato do plano do item 1.

Modelo: Opus, esforço alto — regras e números novos do degrau 2, sem plano fechado.

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

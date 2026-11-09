# Briefing da próxima sessão

Para começar, basta abrir uma sessão neste repositório e dizer: **"Leia `docs/PROXIMA-SESSAO.md` e execute a próxima etapa."**

## Contexto em 30 segundos

**Agiota S.A.** é um jogo de gestão em turnos, no navegador, sobre como os bancos ganham dinheiro, em tom de sátira seca. O jogador começa como agiota e sobe até conglomerado; o placar é o patrimônio pessoal protegido. Design em [`GDD.md`](GDD.md); ordem de execução em [`ROADMAP.md`](ROADMAP.md); convenções em [`../CLAUDE.md`](../CLAUDE.md); histórico em [`LOG.md`](LOG.md).

## Próxima etapa

**Antes de tudo: playtest do Marco 1a.** O 1a fechou nesta leva (atenção policial, bolso, 19 ocorrências, crise e finais; PRs #6 a #8). Se o dono abriu issues de bug ou de balanço depois de jogar, elas vêm antes do 1b. Pontos para observar no celular: o primo ficou caro (crise em 55% das partidas de 40 semanas, preso em 30%); a tragédia aparece em ~12% das partidas com a política padrão; o padrão com ocorrências tem pouca busca (7%); a tela final só tem "Nova partida".

**Planejar com o Opus antes: Marco 1b — dilema da lavagem para abrir a ESC (fachada, laranja, consultoria, devagar).** Esta etapa ainda não tem números nem textos fechados; não execute sem o plano.

**O que já existe no código:** caixa e bolso separados (`state.pocket`: em seu nome, laranja, lá fora, bloqueado), atenção policial e inquérito (`police.ts`), dilemas genéricos (`state.dilemmas`, tabela `dilemmaOptions` em `incidents.ts`), ocorrências com efeitos contínuos, crise e finais (`crisis.ts`, `state.ended`, `EndScreen`), `retire` a partir da semana 20.

**O que o plano precisa fechar:** quando a transição fica disponível (semana, caixa ou patrimônio mínimo) e como o jogador a pede; quanto capital declarado a ESC exige; as quatro saídas do GDD (consultoria, fachada, laranja como sócio, devagar), cada uma com custo, tempo e o risco que deixa (Receita Federal, laranja, fio solto) e de onde sai o dinheiro (caixa, bolso, laranja); o que a ficha do degrau 1 carrega (buscas, propinas, `primoGone`, atenção) para o degrau 2; o que acontece com a carteira de agiota aberta na hora da troca; se a subida é um "final" ou um degrau novo no mesmo save (ou uma tela "em breve" até a ESC existir); a tela da transição; mudança de save (`SAVE_VERSION` 8); alvos do `sim` (ex.: em quantas partidas de 40 semanas o bot com política padrão junta o capital). Seções do GDD: 6 (as duas contas), 14 da referência (lavagem) e 16 ("Transição 1 → 2" e "Degrau 2"). Leia o 1b no `ROADMAP.md` para ver o que fica para os itens seguintes (fichas de empresas, regras da ESC, Selic, cartas de prática, Receita).

Modelo: Opus, esforço alto — planejar a transição para a ESC (decisão de design e balanço).

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

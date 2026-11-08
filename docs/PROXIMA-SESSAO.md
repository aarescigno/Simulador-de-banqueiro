# Briefing da próxima sessão

Para começar, basta abrir uma sessão neste repositório e dizer: **"Leia `docs/PROXIMA-SESSAO.md` e execute a próxima etapa."**

## Contexto em 30 segundos

**Agiota S.A.** é um jogo de gestão em turnos, no navegador, sobre como os bancos ganham dinheiro, em tom de sátira seca. O jogador começa como agiota e sobe até conglomerado; o placar é o patrimônio pessoal protegido. Design em [`GDD.md`](GDD.md); ordem de execução em [`ROADMAP.md`](ROADMAP.md); convenções em [`../CLAUDE.md`](../CLAUDE.md); histórico em [`LOG.md`](LOG.md).

## Próxima etapa

**Planejar com o Opus antes: Marco 1a — atenção policial (faixa), denúncia, investigação.** Esta etapa ainda não tem números nem textos fechados; não execute sem o plano.

**O que já existe no código** (PR da cobrança): `state.complaints` conta denúncias (pressão, primo, moto, celular, cartão do INSS e "ambiente" pelo medo); `state.word` (boca a boca, 0–100, "atrai atenção" no GDD) e `state.fear` (medo) já são lidos pelo motor; eventos `complaint` saem no Jornal. Falta transformar isso em **atenção policial** (faixa baixa/média/alta, visível no Resumo; chance de investigação por semana) e no que a investigação faz com o jogador.

**O que o plano precisa fechar:** como denúncias e boca a boca viram a faixa (limiares, decaimento); a chance semanal de investigação por faixa; a consequência de cada investigação (multa, apreensão de caixa, empréstimo travado, delegado a subornar: ver Bolso e eventos adiante); alvos do `sim` (ex.: denúncias do padrão/primo levam a investigação em tantas partidas de 30 semanas); textos do Jornal e do Resumo; mudança de save (`SAVE_VERSION` 4, migração 3→4). Seções do GDD: 8 (Indicadores), 9 (Crise e saídas) e 16 (Degrau 1).

**Estado do balanço depois do PR da cobrança** (20% a.m., 8 sem, 100 rodadas, semana 30; valores em `src/content/params.ts`, bloco `collection`): sem cobrança 30,8 mil, padrão 38,0 mil, primo 38,1 mil; medo 0 / 37 / 74; boca 80 / 24 / 2; denúncias 0 / 2,8 / 7,8. Com garantia e política padrão: 43,7 mil (+15%), denúncias 4,0, boca 12. A "denúncia" ainda é só contador.

Modelo: Opus, esforço alto — planejar a faixa e as consequências da investigação (decisão de design e balanço).

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

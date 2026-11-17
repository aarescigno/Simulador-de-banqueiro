# Briefing da próxima sessão

Para começar, basta abrir uma sessão neste repositório e dizer: **"Leia `docs/PROXIMA-SESSAO.md` e execute a próxima etapa."**

## Contexto em 30 segundos

**Agiota S.A.** é um jogo de gestão em turnos, no navegador, sobre como os bancos ganham dinheiro, em tom de sátira seca. O jogador começa como agiota e sobe até conglomerado; o placar é o patrimônio pessoal protegido. Design em [`GDD.md`](GDD.md); ordem de execução em [`ROADMAP.md`](ROADMAP.md); convenções em [`../CLAUDE.md`](../CLAUDE.md); histórico em [`LOG.md`](LOG.md).

## Próxima etapa

O Marco 1b, item 2b (fichas irregulares e fios soltos) foi entregue, com uma pendência de balanço: no `sim`, aceitar as irregulares **não** rende mais (distribuído ~4% menor; ver `docs/LOG.md`, entrada 2b). Falta também conferir em 360 px o cartão irregular e o "Executar já" com valor 0.

**Planejar com o Opus antes**, em duas partes, de preferência na mesma sessão:
1. **Fechar o balanço das irregulares.** Decidir por que a irregular compensa para o jogador (taxa livre mais alta com calote proporcional, valor da média empresa dentro do capital, ou outra regra) e dar os números. O capital declarado limita a carteira, então só rende mais se o retorno por real emprestado subir.
2. **Item 3: Selic e economia local.** Fechar regras e números (efeito da Selic no calote e na procura, choques locais, textos, parâmetros, testes, alvos do `sim`).

Depois do plano, a execução é Sonnet, médio.

Modelo: Opus, esforço médio ou alto — decisão de design (balanço das irregulares e regras da Selic) ainda em aberto.

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

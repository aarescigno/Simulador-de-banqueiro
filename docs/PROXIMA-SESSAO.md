# Briefing da próxima sessão

Para começar, basta abrir uma sessão neste repositório e dizer: **"Leia `docs/PROXIMA-SESSAO.md` e execute a próxima etapa."**

## Contexto em 30 segundos

**Agiota S.A.** é um jogo de gestão em turnos, no navegador, sobre como os bancos ganham dinheiro, em tom de sátira seca. O jogador começa como agiota e sobe até conglomerado; o placar é o patrimônio pessoal protegido. Design em [`GDD.md`](GDD.md); ordem de execução em [`ROADMAP.md`](ROADMAP.md); convenções em [`../CLAUDE.md`](../CLAUDE.md); histórico em [`LOG.md`](LOG.md).

## Próxima etapa

**Marco 1a — política de cobrança em 3 níveis com exceções por devedor; medo e boca a boca.** Especificação no GDD, seção 16 ("Cobrança por política"). Pontos que já se sabem:

- Três níveis: conversa, pressão (ligar no trabalho, na família), "mandar o primo". Regra padrão por semana de atraso, editável na aba Políticas; exceção por devedor na Carteira (escalar já ou perdoar).
- Cada nível aumenta o pagamento, o medo e a chance de denúncia. O medo é visível e sobe a taxa de pagamento de todos; o boca a boca atrai pedidos e atenção.
- Dar ao uso de garantia um custo: tomar a moto ou reter o cartão do INSS mexe em medo e boca a boca (ver "Para observar" na última entrada do log).
- A atenção policial em si é o item seguinte do roadmap; aqui só se acumula o que vai alimentá-la.

## Protocolo de toda sessão

1. Ler `CLAUDE.md`, `docs/GDD.md`, `docs/ROADMAP.md` e a entrada mais recente de `docs/LOG.md`.
2. Ver as issues abertas no GitHub. Bug ou ajuste de balanço aberto tem prioridade sobre o roadmap; ideia fica registrada para o marco certo.
3. Executar **um** item do roadmap (a "Próxima etapa" acima), pequeno e jogável. Regra nova do motor ganha teste; mudou o save, sobe `SAVE_VERSION` com migração.
4. Rodar `npm run typecheck`, `npm run lint`, `npm test` e `npm run build`. Conferir a tela em 360 px.
5. No mesmo PR: marcar o checkbox no `ROADMAP.md`, acrescentar a entrada no topo do `LOG.md` e reescrever a seção "Próxima etapa" deste arquivo para o item seguinte.
6. Abrir o PR para a `main`, esperar o CI passar e fazer o merge. O merge publica no GitHub Pages.
7. Dizer ao dono o que testar no celular e qual é a próxima etapa.

## Critério de pronto de cada etapa

CI verde, merge feito, jogo funcionando no link do Pages, log e briefing atualizados.

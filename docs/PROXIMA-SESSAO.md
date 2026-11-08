# Briefing da próxima sessão

Para começar, basta abrir uma sessão neste repositório e dizer: **"Leia `docs/PROXIMA-SESSAO.md` e execute a próxima etapa."**

## Contexto em 30 segundos

**Agiota S.A.** é um jogo de gestão em turnos, no navegador, sobre como os bancos ganham dinheiro, em tom de sátira seca. O jogador começa como agiota e sobe até conglomerado; o placar é o patrimônio pessoal protegido. Design em [`GDD.md`](GDD.md); ordem de execução em [`ROADMAP.md`](ROADMAP.md); convenções em [`../CLAUDE.md`](../CLAUDE.md); histórico em [`LOG.md`](LOG.md).

## Próxima etapa

**Marco 1a — política de cobrança em 3 níveis com exceções por devedor; medo e boca a boca.** Contexto no GDD, seção 16 ("Cobrança por política"). Números fechados abaixo; vão para `src/content/params.ts`.

**Regra de cobrança.** Atraso = `missedStreak` (semanas seguidas sem pagar), lido no começo da semana, antes do sorteio. Cada nível tem um limiar "a partir da N-ª semana de atraso" (1 a 5) ou "nunca"; vale o nível mais alto cujo limiar ≤ atraso. Padrão: conversa 1, pressão 2, primo 4. `defaultAfterWeeks` passa de 4 para 6, para o primo ter vez. Exceção por devedor na Carteira: `override` = `conversa | pressao | primo | null` (null segue a regra); vale só enquanto o devedor está em atraso. Perdoar é ação à parte (abaixo).

**Efeito de cada aplicação** (uma por devedor em atraso por semana; o efeito no medo, no boca a boca e o sorteio de denúncia acontecem pague ou não):

| Nível | + chance de pagar | + pagar se quebrou | + chance de quebrar | Medo | Boca a boca | Denúncia |
| --- | --- | --- | --- | --- | --- | --- |
| Conversa | +0,08 | 0 | 0 | +0,3 | 0 | 0 |
| Pressão | +0,16 | +0,05 | +0,02 | +1,5 | −1 | 2% |
| Primo | +0,28 | +0,15 | +0,03 | +4 | −3 | 6% |

**Medo** (0–100, começa em 0, visível): toda semana, depois dos ganhos, `medo × 0,85`. Soma `0,12 × medo/100` na chance de pagar de todo devedor não quebrado (em dia ou não). Sobe o risco de quem pede: `+0,10 × medo/100` no risco bruto (quem tem opção não vem). Denúncia ambiente: `0,03 × medo/100` por semana.

**Boca a boca** (0–100, começa em 30, visível): toda semana anda 5% em direção a 30. Ganhos: empréstimo feito +1, quitado +1, perdão +4. Pedidos por semana: `perWeek` passa a [1, 2] + `floor(boca/40 + sorteio)`, teto 5 (em 30 dá a média de hoje, ~2,25). A atenção policial que ele atrai fica para o próximo item (o valor já está no estado).

**Custo das garantias:** celular tomado no calote: medo +1, boca −1, denúncia 3%. Moto tomada: medo +4, boca −4, denúncia 15%. Cartão do INSS: boca −2 ao fechar o empréstimo e denúncia 0,5% por semana enquanto retido.

**Perdoar:** encerra o empréstimo com `status: 'forgiven'`, o saldo vai para `stats.forgiven`, boca +4, medo −2, caixa não muda.

**Denúncia:** só conta (`state.complaints += 1`) e sai no Jornal com a origem. Nada de faixa ainda.

**Estado e save:** `SAVE_VERSION` 3; migração 2→3 põe `fear: 0`, `word: 30`, `complaints: 0`, `policy.collection` padrão, `override: null` e `lastLevel: null` nos empréstimos, `stats.forgiven: 0`. `WeekReport` ganha `fear` e `word` (setinha de variação no Resumo).

**Funções:** em `agiota.ts`, `levelFor(policy, loan)`, aplicação do nível dentro de `collect` (bônus em `payChance` e `hazard` por parâmetro, sem duplicar a fórmula), `generateRequests` lê `word` e `fear`, `forgive`. Em `game.ts`, decisões novas `setPolicy`, `setOverride {loanId, override}`, `forgive {loanId}`; decaimento e denúncia ambiente no fim do `step`.

**Telas e textos** (em `src/content/`; ajustar a voz é livre, o sentido não):
- Políticas (troca o Placeholder): seção "Cobrança", "Regra para todo devedor em atraso. Exceções na Carteira." Por nível, nome, frase e seletor "a partir da N-ª semana de atraso" / "Nunca". Conversa: "Passar lá, lembrar da data." Pressão: "Ligar no trabalho. Falar com a família." Mandar o primo: "O primo resolve. Não pergunte como."
- Carteira: no empréstimo ativo, atraso e nível da semana; chips Regra / Conversa / Pressão / Primo; botão "Perdoar dívida" com confirmação "Perdoar R$ X? O bairro vai saber."
- Resumo: Medo ("Faz todo mundo pagar. Afasta quem tem opção.") e Boca a boca ("Traz pedidos. E gente perguntando."), 0–100 com setinha. Painel dev: medo, boca e denúncias exatos.
- Jornal: pago depois da conversa / "depois de uma ligação para o trabalho" / "O primo passou lá ontem."; atraso com nível: "Prometeu sexta." / "A família já sabe." / "O primo voltou de mãos vazias."; denúncia: pressão "Um patrão foi à delegacia reclamar de ligações.", primo "Boletim de ocorrência por ameaça. O endereço é do seu bairro.", moto "BO de moto tomada. A placa está no sistema.", celular "Celular tomado virou queixa na delegacia.", INSS "A família de {nome} foi ao INSS perguntar pelo cartão do benefício.", ambiente "Alguém comentou com a ronda que no bairro todo mundo paga em dia."; perdão "Dívida de {nome} perdoada: R$ X. O bairro comentou."

**Testes do motor:** `levelFor` (limiares, "nunca", o mais alto vence, override vence a regra e só vale em atraso); `payChance` cresce com nível e medo; efeitos exatos de cada nível e garantia em medo e boca (RNG falso que sempre acerta / sempre erra para a denúncia); perdão; decaimento; mais boca a boca dá mais pedidos e mais medo dá mais risco (média em 200 sementes); migração 2→3.

**Sim:** `POLICY=nada|conversa|padrao|primo` (nada: tudo "nunca"; conversa: só conversa na 1ª; primo: primo na 1ª) e colunas de medo, boca e denúncias médios na semana 30. Alvos a 20% a.m., 8 sem, 100 rodadas:
1. padrão rende 10–30% mais patrimônio que nada; primo ≥ padrão.
2. Denúncias em 30 semanas: nada < 0,5; padrão 1–3; primo ≥ 2× padrão. Boca a boca do primo ≥ 15 pontos abaixo do padrão.
3. Medo na semana 30: padrão 15–40; primo 40–75.
4. Com `COLLATERAL=1` (padrão): patrimônio no máximo +20% sobre sem garantia (hoje +40%), denúncias +1 ou mais, boca 10+ pontos abaixo.
5. nada fica a ±20% dos 27,5 mil de hoje.

Se errar, ajuste nesta ordem: 1 → bônus de pagamento dos níveis; 2 → chances de denúncia e custo no boca; 3 → ganhos de medo; 4 → `inss.payBonus` (0,15 → até 0,08), depois `inss.brokePay` (0,7 → até 0,5), depois custo das garantias no boca; 5 → `perWeek` e o divisor 40. Anote no log os valores finais e a tabela do sim.

**Pronto quando:** `ferramentas/testar.sh --tudo` verde, alvos do sim batidos, Políticas e Carteira usáveis em 360 px, checkbox marcado.

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

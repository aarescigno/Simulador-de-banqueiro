# Briefing da próxima sessão

Para começar, basta abrir uma sessão neste repositório e dizer: **"Leia `docs/PROXIMA-SESSAO.md` e execute a próxima etapa."**

## Contexto em 30 segundos

**Agiota S.A.** é um jogo de gestão em turnos, no navegador, sobre como os bancos ganham dinheiro, em tom de sátira seca. O jogador começa como agiota e sobe até conglomerado; o placar é o patrimônio pessoal protegido. Design em [`GDD.md`](GDD.md); ordem de execução em [`ROADMAP.md`](ROADMAP.md); convenções em [`../CLAUDE.md`](../CLAUDE.md); histórico em [`LOG.md`](LOG.md).

## Próxima etapa

**Marco 1a — 19 ocorrências: delegado, milícia, rival, devedor some, tragédia implícita e outras.** Contexto no GDD, seção 16 ("Eventos") e seção 12 (tom). Plano fechado pelo Opus; números em `src/content/params.ts`, bloco novo `incidents`; textos em `src/content/incidents.ts` novo. Reusa o dilema do inquérito. Nenhuma ocorrência termina a partida (isso é do item seguinte).

**Mecânica.** No fim de cada semana, depois de `tickPolice` e `tickPocket`, `tickIncidents(state, rng, events)`:
1. Paga os efeitos contínuos: mesada do delegado e parte da milícia (abaixo).
2. Dispara as ocorrências agendadas para esta semana (`state.incidents.scheduled`, lista de `{ week, id, loanId? }`).
3. Com chance 0,35, sorteia **uma** ocorrência entre as elegíveis, com o peso de cada uma. Elegível = gatilho verdadeiro, `semana ≥ minWeek`, fora do intervalo de repetição (`cooldown`, contado de `state.incidents.last[id]`), e, se for dilema, sem outro dilema de ocorrência pendente. Ocorrência que mira um devedor sorteia um entre os empréstimos ativos que cumprem o gatilho.
- **Notícia:** aplica o efeito na hora e sai no Jornal (evento `incident { id, name?, amount? }`).
- **Dilema:** entra em `state.dilemmas` para a semana seguinte, com `kind = id`, `loanId?` e `costs` congelados; o evento `incident` anuncia no Jornal. Sem resposta, vale a opção padrão (a primeira da lista abaixo marcada com *). Escolha → evento `incidentChoice { id, option, name?, amount? }`. Todas as escolhas são determinísticas (sem sorteio no `decide`); o que tiver sorte fica para um agendamento resolvido no `step`.
- `DilemmaKind` passa a ser `'inquerito' | IncidentId`; `DilemmaOption` vira string validada por uma tabela de opções por tipo em `src/engine/incidents.ts` (o inquérito entra na mesma tabela). `Dilemma` ganha `loanId?`. Hoje o `step` só faz `state.dilemmas = []` (a padrão do inquérito não tem efeito); troque por aplicar a opção padrão de cada dilema pendente. `applyChoice` (em `police.ts`) passa a despachar por `kind`.

**Efeitos contínuos** (`state.incidents`): `last`, `scheduled`, `mesada` (R$/semana, 0 = não paga), `militia` (`'none' | 'paying' | 'refused' | 'refusedTwice'`) e `militiaRate`, `rivalUntil`, `primoOutUntil`, `vereadorUntil`, `shock { until, payDelta }`.
- Mesada: toda semana sai do caixa; se o caixa não cobre, a mesada para, atenção +15 e o Jornal avisa. Enquanto paga, chance de inquérito × 0,4.
- Milícia pagando: toda semana leva `militiaRate` do que entrou de parcelas na semana.
- Rival ativo (`semana < rivalUntil`): 1 pedido a menos por semana e taxa máxima dos pedidos novos −8.
- Primo fora (`semana < primoOutUntil`): onde a regra ou a exceção pede o primo, vale a pressão.
- Vereador (`semana < vereadorUntil`): chance de inquérito × 0,6 (acumula com a mesada).
- Choque (`semana < shock.until`): `payDelta` soma na chance de pagar de quem não quebrou.

**As 19 ocorrências** (peso; gatilho; `minWeek`; `cooldown`; efeito). Valores em reais.

| id | tipo | peso | gatilho | min | cooldown | efeito / opções (* = padrão) |
| --- | --- | --- | --- | --- | --- | --- |
| `delegado` | dilema | 3 | atenção média ou alta, sem mesada | 6 | 12 | *`recusar`: atenção +10. `mesada`: 600 por semana, atenção −10 já |
| `milicia` | dilema | 3 | `stats.received` ≥ 10.000, milícia `none` | 8 | — (uma vez) | *`pagar`: milícia `paying`, taxa 10%, medo +5 (quem não responde, paga). `recusar`: milícia `refused`, agenda `milicia_recado` em 3 semanas |
| `milicia_recado` | dilema | — | só agendada | — | — | *`pagar`: `paying`, taxa 15%. `recusar`: `refusedTwice`, caixa −40%, medo × 0,5, primo fora 6 semanas (o item da crise vai continuar essa história) |
| `rival` | dilema | 3 | sem rival ativo | 6 | 15 | *`ignorar`: rival por 8 semanas. `primo`: sem rival, atenção +15, medo +5 (indisponível com primo fora) |
| `rolar` | dilema, devedor | 4 | empréstimo com 2+ semanas de atraso | 3 | 4 | *`recusar`: nada. `rolar`: as parcelas em atraso (até 2) contam como pagas com dinheiro seu (`paidInstallments`, `totalPaid`, `stats.lent` e `stats.received` sobem igual; caixa não muda), `weeks + 3`, `totalDue + 3 × parcela`, `missedStreak = 0` |
| `bem` | dilema, devedor | 3 | empréstimo com 3+ semanas de atraso | 3 | 6 | *`recusar`: nada. `aceitar`: fecha como calote recuperando `round(0,25 × saldo)` (geladeira usada), medo +1, boca −2 |
| `pastor` | dilema | 2 | — | 4 | 12 | *`recusar`: boca −2. `dar` (1.000): boca +6, atenção −5 |
| `vereador` | dilema | 2 | — | 10 | — (uma vez) | *`recusar`: nada. `emprestar` (5.000): vereador por 20 semanas; agenda `vereador_paga` em 20 semanas |
| `vereador_paga` | notícia | — | só agendada | — | — | 40%: devolve 5.000; senão, só o texto |
| `radio` | dilema | 2 | atenção média ou alta e 2+ denúncias | 6 | 10 | *`ignorar`: atenção +8, boca −5. `pagar` (1.500): atenção −8 |
| `fianca` | dilema | 3 | algum empréstimo com `lastLevel` primo nesta semana | 5 | 12 | *`deixar`: primo fora 6 semanas, atenção +15. `pagar` (2.000): nada |
| `pm` | dilema | 2 | — | 8 | 20 | *`recusar`: atenção +5. `emprestar` (3.000): atenção −12; agenda `pm_paga` em 10 semanas |
| `pm_paga` | notícia | — | só agendada | — | — | 50%: devolve 3.000; senão, só o texto |
| `assalto` | notícia | 2 | caixa ≥ 15.000 | 5 | 15 | caixa −25% |
| `some` | notícia, devedor | 3 | empréstimo ativo com risco ≥ 0,5 | 4 | 6 | empréstimo perdido (`lost`, saldo em `writtenOff`), boca −1 |
| `tragedia` | notícia, devedor | 1 | empréstimo com 3+ semanas de atraso e `lastLevel` pressão ou primo | 8 | 20 | empréstimo perdido, boca −10, atenção +20 |
| `gas` | notícia | 2 | — | 4 | 16 | choque −0,06 por 4 semanas |
| `decimo` | notícia | 3 | semana ≥ 20 | 20 | — (uma vez) | choque +0,08 por 2 semanas |
| `cartao` | notícia, devedor | 2 | empréstimo ativo com cartão do INSS | 6 | 10 | o empréstimo perde a garantia (`collateral = null`) |

(`milicia_recado`, `vereador_paga` e `pm_paga` são agendadas e não contam no sorteio; as 16 sorteáveis mais as 3 de seguimento dão 19.) Perder empréstimo usa a mesma rotina da busca (extraia `loseLoan(state, loan)` em `police.ts` se ainda não existir). Atenção mexida pelas ocorrências não é denúncia: some direto em `police.heat`, limitada a 0–100.

**Textos** (`src/content/incidents.ts`; a voz pode ser ajustada, o sentido não; nomes fictícios). A primeira opção listada é a padrão. Para cada id: título do cartão, corpo, rótulo e dica de cada opção, linha do Jornal da ocorrência e de cada escolha.
- delegado: "Café com o delegado" / "O delegado Moacir passou para um café. Disse que o bairro anda agitado e que ele sabe acalmar." / "Agradecer o café" ("Ele não gostou.") / "Pagar a mesada · R$ 600 por semana" ("Inquérito fica mais raro enquanto pagar."). Jornal: mesada "Mesada combinada com o delegado. Toda sexta."; recusa "O delegado saiu sem terminar o café."; mesada falhou "A mesada atrasou. O delegado não ligou para cobrar. Isso é pior."
- milicia: "O bairro tem dono" / "Dois homens de colete passaram para conhecer o negócio. Querem 10% do que entra." / "Pagar 10%" / "Dizer que o negócio é seu" ("Eles voltam."). Jornal da parte: "A parte do bairro: R$ X."
- milicia_recado: "Recado" / "O primo apareceu com o olho roxo. Mandaram dizer que agora são 15%." / "Pagar 15%" / "Recusar de novo" ("Eles sabem onde fica a gaveta."). Jornal da recusa: "Levaram o cofre. R$ X. Ninguém viu nada."
- rival: "Concorrência" / "Abriu um agiota na rua de baixo. Cobra 10% ao mês e não pergunta nada." / "Ignorar" ("Menos gente na porta por 8 semanas.") / "Mandar o primo conversar" ("Resolve. Chama atenção.").
- rolar: "{nome} quer rolar" / "{nome} pede mais para pagar a própria parcela. Jura que o bico novo começa segunda." / "Recusar" / "Rolar a dívida" ("Em dia no caderninho. A dívida cresce."). Jornal: "{nome} rolou a dívida. Em dia no caderninho."
- bem: "{nome} oferece a geladeira" / "{nome} oferece a geladeira para fechar a conta. Está ligada, tem gelo." / "Recusar" / "Aceitar a geladeira" ("Fecha a conta. Vende por uns R$ X."). Jornal: "Geladeira de {nome} vendida: R$ X. A conta fechou."
- pastor: "Oferta" / "O pastor pede uma oferta para o telhado do templo." / "Dizer que está difícil" / "Dar R$ 1.000" ("O pastor fala bem de você no culto.").
- vereador: "Entre amigos" / "O vereador Dorival pede R$ 5.000 até a eleição. Sem juros, entre amigos." / "Recusar" / "Emprestar" ("Ele conhece o delegado. Pagar, talvez."). vereador_paga: "O vereador devolveu os R$ 5.000. Pediu voto." / "O vereador perdeu a eleição. Os R$ 5.000 também."
- radio: "Rádio comunitária" / "A rádio do bairro vai fazer um programa sobre juros." / "Ignorar" / "Patrocinar o programa · R$ 1.500" ("O programa vira sobre financiamento de carro.").
- fianca: "O primo na blitz" / "O primo foi detido numa blitz. Estava com a lista de endereços." / "Deixar lá" ("Sem primo por 6 semanas. Ele pode falar.") / "Pagar a fiança · R$ 2.000".
- pm: "Favor" / "Um PM do batalhão pede R$ 3.000. Diz que paga quando der." / "Recusar" / "Emprestar" ("A ronda passa menos."). pm_paga: "O PM devolveu os R$ 3.000. Trouxe um bolo." / "O PM foi transferido. Os R$ 3.000 ficaram."
- assalto: "Entraram na sua casa de madrugada. Levaram R$ X da gaveta. Não dá para registrar BO."
- some: "{nome} mudou de cidade de madrugada. A casa está para alugar."
- tragedia: "{nome} não vai mais pagar. A família fechou a casa e pediu que ninguém passasse por lá." e, sempre logo abaixo, a nota "Se você ou alguém próximo precisar conversar, o CVV atende 24 horas pelo 188 ou em cvv.org.br." Sem piada, sem adjetivo.
- gas: "O gás subiu de novo. O bairro aperta o cinto."
- decimo: "Saiu o décimo terceiro de quem tem carteira assinada."
- cartao: "O INSS trocou o cartão de benefício de {nome}. O antigo não passa mais."

**Telas:** o `DilemmaCard` vira genérico (título, corpo e opções vindos do conteúdo por `kind`, com nome e valores interpolados; opção com custo maior que o caixa desabilitada). Com dois dilemas pendentes, mostra os dois, um embaixo do outro. Faixas pequenas no Resumo, abaixo dos medidores, para efeitos contínuos ativos: "Mesada: R$ 600/semana", "Milícia: 10% do que entra", "Rival na rua de baixo · até a semana N", "Primo fora · até a semana N". Painel dev: estado de `incidents` e um botão "Forçar ocorrência" com seletor de id (para testar no celular).

**Estado e save:** `SAVE_VERSION` 6. `GameState.incidents` como acima. Migração 5→6: `incidents` zerado (`last: {}`, `scheduled: []`, `mesada: 0`, `militia: 'none'`, `militiaRate: 0`, os prazos em 0, `shock: { until: 0, payDelta: 0 }`).

**Testes do motor** (`tests/ocorrencias.test.ts`): elegibilidade (gatilho, `minWeek`, `cooldown`, uma vez, um dilema por vez); cada opção de cada dilema com efeito exato; padrão sem resposta; mesada paga e falha sem caixa; parte da milícia sobre o recebido da semana; recado agendado em 3 semanas; rival tira pedido e baixa a taxa máxima (média em 200 sementes); primo fora vira pressão em `levelFor`; choque mexe em `payChance`; `rolar` e `bem` nos números do empréstimo; `some` e `tragedia` perdem o empréstimo; `cartao` tira a garantia; vereador e PM pagam ou não pelo sorteio agendado; migração 5→6. Teste de conteúdo: toda ocorrência e toda opção têm texto.

**Sim:** o bot responde dilemas com a opção padrão (`INC=padrao`), com a que paga quando o caixa cobre (`INC=paga`) ou com a recusa (`INC=recusa`: recusa milícia, delegado, pastor etc.); `INC=0` zera a chance semanal (mude o objeto `params` no sim). Coluna nova: ocorrências por partida. Alvos a 20% a.m., 8 sem, 100 rodadas, semana 30, política padrão:
1. 7 a 12 ocorrências por partida, em média.
2. Pelo menos 14 das 16 sorteáveis aparecem somadas as 100 partidas.
3. Patrimônio com `INC=padrao` entre 80% e 100% do patrimônio com `INC=0`.
4. `INC=paga` não fica mais de 10% acima de `INC=padrao` em patrimônio (pagar não é sempre o certo).
5. Tragédia em no máximo 1 de cada 4 partidas com política primo.

Se errar, ajuste nesta ordem: 1 → chance semanal; 2 → pesos e gatilhos; 3 → `assalto` e a milícia; 4 → custos das opções pagas; 5 → peso da tragédia. Anote no log os valores finais e a tabela do sim.

**Estado do balanço depois do PR da polícia e do bolso** (20% a.m., 8 sem, 100 rodadas, semana 30, `INQ=correr`, sem bolso): nada 31,8 mil · inquérito 0% · busca 0%; padrão 35,1 mil · 38% · 10%; primo 28,3 mil · 86% · 57%. Bolso: `block.weeks` ficou em 14.

**Pronto quando:** `ferramentas/testar.sh --tudo` verde, alvos do sim batidos, cartões de dilema e faixas legíveis em 360 px, checkbox marcado.

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

# Agiota S.A.

Jogo de gestão bancária em turnos, no navegador, em português. Design e decisões: `docs/GDD.md`; ordem de execução: `docs/ROADMAP.md`; etapa da vez e protocolo: `docs/PROXIMA-SESSAO.md`. `docs/referencia/` é a base factual sobre bancos; use-a para mecânicas e notas "na vida real". Docs grandes se leem por seção (ver **Economia**), não inteiros.

## Fluxo

- Uma entrega pequena e jogável por PR, sempre para a `main`. O merge publica no GitHub Pages, e o dono testa no Android com o jogo instalado como PWA.
- Antes de abrir PR: `ferramentas/testar.sh` verde (typecheck, lint, testes e build, uma linha cada; `--tudo` inclui o `sim`).
- Feedback chega por issues; trabalhe a partir delas quando houver.
- Ao terminar um item do roadmap, marque o checkbox no mesmo PR.
- Toda sessão segue o protocolo de `docs/PROXIMA-SESSAO.md`: no mesmo PR, acrescenta a entrada no topo de `docs/LOG.md` e reescreve a "Próxima etapa" do briefing. Depois do CI verde, a sessão faz o merge.

## Código

- TypeScript + Vite + Preact + Vitest.
- `src/engine/` é puro: sem DOM, determinístico, toda aleatoriedade via o RNG com semente do estado. Toda regra nova do motor ganha teste.
- `src/content/` guarda todo texto exibido ao jogador e os parâmetros de balanço. Nada de texto de jogo escrito dentro de componentes.
- Nomes: estrutura em inglês (`state`, `step`, `loan`, `debtor`); termos do domínio brasileiro em português quando não há tradução boa (`agiota`, `esc`, `consignado`, `fgc`, `pdd`, `laranja`).
- Mudou o formato do save: incremente `saveVersion` e escreva a migração.
- Mobile-first: teste o layout em 360 px de largura.

## Tom dos textos

- Sátira seca: frases curtas, voz de relatório ou manchete, sem adjetivo moral, sem sermão.
- Violência e tragédias sempre implícitas. Eventos de suicídio só de forma indireta, com a nota do CVV (188).
- Nomes de pessoas, bancos e cidades são fictícios. Casos reais só nas notas "na vida real", com fonte.
- Diversão vence realismo nos números, mas a direção de cada efeito precisa ser real.

## Economia (tokens e custo)

- **Docs por seção:** `ferramentas/indice.sh GDD|ROADMAP|LOG [filtro]` dá cada seção com as linhas; leia só a faixa (Read com `offset` e `limit`). Do `LOG.md`, só a entrada mais nova.
- **Código por faixa:** `ferramentas/mapa.sh [filtro]` acha função, tipo e componente com a linha. Varredura larga, com o agente `Explore`.
- **Fora do Read:** o que está no `permissions.deny` do `.claude/settings.json` (`node_modules`, `dist`, lockfile). Saída longa de comando sempre com `| tail` ou `| head`.
- **Anexar sem reler:** entrada nova do log com `python3 ferramentas/anota.py docs/LOG.md <<'EOF' ... EOF`. Quando o `LOG.md` passar de ~15 KB, as entradas antigas vão para `docs/LOG-ANTIGO.md` com `python3 ferramentas/arquiva.py docs/LOG.md docs/LOG-ANTIGO.md --topo "## data"`.
- **Este arquivo custa em todo turno:** só regras; detalhe vai para os docs. Quando os docs incharem, siga `docs/ENXUGAR.md`.
- **Hábitos:** uma etapa por sessão; sessão nova depois de umas 15 trocas. Ao começar a etapa, renomeie a sessão (`set_session_title`) com 3 a 6 palavras.

## Modelo e esforço

- **Planejar com o Opus, executar com o mais barato que der conta.** Planejar (fechar regras e números de uma etapa, arquitetura, decisão de design) é Opus, esforço médio ou alto. Executar: Sonnet, médio, para código com plano decidido; Haiku, baixo, só para o mecânico (textos, números já decididos, docs).
- **Plano pronto deixa as decisões tomadas:** valores, textos, arquivos e funções que mudam, testes e critério de pronto. O que ficar em aberto diz como decidir (ex.: "ajuste X até o `sim` dar Y").
- **A "Próxima etapa" do briefing termina com a linha** `Modelo: Sonnet, esforço médio — motivo`. Se começa com "planejar com o Opus antes", a etapa não está pronta para executar.
- **Conferência de abertura** (antes de mudar arquivo; conversa não precisa): compare a linha **Modelo:** com a sessão (`get_session` sem `session_id`: `session_context.model` e `effort_level`). Se bate, diga numa linha e siga. Se não bate, pergunte com o `AskUserQuestion` (sim/não); no "não", diga como trocar (`/model`) e pare. Etapa não planejada: não decida sozinho; ofereça planejar com o Opus.


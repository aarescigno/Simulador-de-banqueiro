# Agiota S.A.

Jogo de gestão bancária em turnos, no navegador, em português. Antes de qualquer trabalho, leia `docs/GDD.md` (design e decisões tomadas) e `docs/ROADMAP.md` (ordem de execução). `docs/referencia/` é a base factual sobre bancos; use-a para mecânicas e notas "na vida real".

## Fluxo

- Uma entrega pequena e jogável por PR, sempre para a `main`. O merge publica no GitHub Pages, e o dono testa no Android com o jogo instalado como PWA.
- Antes de abrir PR: `typecheck`, testes e build passando.
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

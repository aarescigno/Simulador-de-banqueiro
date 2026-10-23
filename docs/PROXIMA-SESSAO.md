# Briefing da próxima sessão — Marco 0

Para começar, basta abrir uma sessão neste repositório e dizer: **"Leia `docs/PROXIMA-SESSAO.md` e execute o Marco 0."**

## Contexto em 30 segundos

**Agiota S.A.** é um jogo de gestão em turnos, no navegador, sobre como os bancos ganham dinheiro, em tom de sátira seca. O jogador começa como agiota e sobe até conglomerado; o placar é o patrimônio pessoal protegido. Design completo em [`GDD.md`](GDD.md); ordem de execução em [`ROADMAP.md`](ROADMAP.md); convenções em [`../CLAUDE.md`](../CLAUDE.md).

## Entregas, em PRs pequenos para a `main`

Cada PR deve terminar com build, typecheck e testes passando, e com o jogo funcionando no link do GitHub Pages depois do merge.

1. **Scaffold + CI + deploy.** Vite + TypeScript + Preact, ESLint/Prettier, Vitest, workflow de CI (typecheck, testes, build) e workflow de deploy no Pages na `main`. Caminho base relativo. Uma tela "Agiota S.A." com o número da versão.
2. **PWA.** vite-plugin-pwa, manifesto (nome, ícone SVG, cores do tema terminal), offline, aviso "Nova versão — atualizar" com `registerType: 'prompt'`. A versão vem do `package.json` + hash curto do commit.
3. **Motor e save.** `src/engine/`: tipo `GameState` (com `saveVersion`), `step(state, decisions, rng)`, RNG com semente (ex.: mulberry32), fila de eventos. Autosave em `localStorage` a cada turno; exportar/importar como texto. Testes: determinismo (mesma semente → mesmo resultado) e ida e volta do save.
4. **Casca da interface.** Menu principal (continuar, nova partida, versão). Aviso de conteúdo na primeira abertura, com CVV 188. Cinco abas na barra inferior (Resumo, Carteira, Políticas, Bolso, Jornal), tema terminal, fonte mono nos números, formatação `R$ 20 mil` / `R$ 1,2 bi`. Ícones Lucide.
5. **Painel dev.** Aparece ao tocar 10 vezes no número da versão do menu principal. Funções: ver e trocar a semente, dar dinheiro, avançar N semanas, ver as variáveis ocultas, **copiar estado** (semente + turno + save) para a área de transferência.
6. **Primeiro loop do agiota.**
   - R$ 20 mil iniciais; turno = 1 semana.
   - 1 a 3 pedidos por semana, cada um com ficha gerada (nome, profissão, valor, motivo, risco oculto de 0 a 1). Nomes e textos em `src/content/`.
   - O jogador aceita definindo taxa (% ao mês) e prazo (semanas), ou recusa.
   - Parcelas semanais. A chance de pagar cai com o risco do devedor e com a taxa cobrada (direção realista; números ajustáveis num arquivo de parâmetros).
   - Depois de 4 semanas sem pagar, o empréstimo vira calote e o saldo é baixado.
   - Resumo semanal no Jornal, em tom seco ("Seu Jorge pagou. Dona Cida não. Caixa: R$ 23,4 mil.").
   - Teste: um bot simples joga 50 semanas sem quebrar o motor.
7. **Modelos de issue.** `.github/ISSUE_TEMPLATE/` com bug (inclui campo "estado copiado"), ajuste de balanço e ideia.

## Fora do escopo desta sessão

Cobrança em níveis, medo, polícia, bolso, eventos narrativos e ESC. Ficam para o Marco 1, na ordem do roadmap.

## Critério de pronto

Instalar pelo link no Android, jogar 10 semanas emprestando e recebendo, fechar o app, reabrir e continuar a mesma partida. O painel dev abre com 10 toques e copia o estado.

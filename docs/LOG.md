# Diário de sessões

Registro de cada sessão de trabalho, da mais nova para a mais antiga. Toda sessão acrescenta uma entrada no mesmo PR da entrega, antes do merge, seguindo [`PROXIMA-SESSAO.md`](PROXIMA-SESSAO.md).

Formato de cada entrada: data · item do roadmap · PR; o que foi feito; decisões tomadas; pendências e pontos de balanço para observar; próximo passo.

---

## 2026-10-24 · Marco 1a · Garantias e negociação nos pedidos · PR #2

**Feito**
- Cada pedido traz os bens do devedor: celular (todos), moto (entregador quase sempre, demais às vezes), cartão do INSS (só aposentado).
- O jogador escolhe a garantia na ficha (ou nenhuma) e oferece taxa e prazo.
- Negociação: cada devedor tem uma taxa máxima oculta, que sobe com o risco (quem está desesperado topa qualquer coisa; quem tem opção pechincha). Exigir garantia baixa essa taxa. Oferta acima vira contraproposta ("A 35% eu fecho."), com botão para fechar nela; sem paciência (1 a 2 contrapropostas), o devedor vai pedir a outro e sai no Jornal.
- Efeito das garantias: aumentam a chance de pagar; no calote, celular e moto são vendidos com deságio e abatem a perda (nunca além do que falta); o cartão do INSS faz pagar mesmo depois de o devedor quebrar, mas no calote o banco bloqueia o cartão e não rende nada.
- Save versão 2 com migração da 1. Painel dev mostra taxa máxima e paciência.
- Bot do `sim/` negocia (topa contraproposta) e pode exigir garantia (`COLLATERAL=1 npm run sim`).

**Decisões**
- Parâmetros em `src/content/params.ts` (`negotiation`, `collateral`); textos em `src/content/collateral.ts`, `ui.ts` e `journal.ts`.
- A contraproposta é sempre a taxa máxima que o devedor topa com a garantia escolhida: negociar revela o teto.

**Para observar**
- Balanço: hoje exigir garantia sempre compensa (no sim, a 20% a.m. em 8 semanas, patrimônio médio em 30 semanas sobe de ~27 mil para ~39 mil). O custo da garantia (medo, boca a boca, denúncia, BO de moto tomada) entra no próximo item.
- Reter cartão do INSS é crime (Estatuto da Pessoa Idosa, art. 104). Nota "na vida real" fica para o item de notas do Marco 1c.

**Próximo passo**
- Marco 1a: política de cobrança em 3 níveis com exceções por devedor; medo e boca a boca.

---

## 2026-10-24 · Marco 0 · Fundação + primeiro loop · PR #1

**Feito**
- Scaffold Vite + TypeScript + Preact, ESLint/Prettier, Vitest, CI (typecheck, lint, testes, build) e deploy no GitHub Pages.
- PWA com aviso de nova versão; motor puro com RNG de semente, fila de eventos e save versionado; autosave e exportar/importar.
- Casca mobile: menu, aviso de conteúdo (CVV 188), cinco abas, tema terminal; painel dev com 10 toques na versão.
- Primeiro loop do agiota: pedidos semanais, taxa e prazo, parcelas, calote após 4 semanas, Jornal semanal; bot joga 50 semanas nos testes.
- Modelos de issue: bug, ajuste de balanço, ideia.

**Próximo passo**
- Marco 1a: garantias e negociação nos pedidos.

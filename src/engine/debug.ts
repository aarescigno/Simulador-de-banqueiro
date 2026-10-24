import { hazard, payChance } from './agiota';
import type { GameState } from './state';

const r3 = (x: number) => Math.round(x * 1000) / 1000;

/** Variáveis que o jogador não vê, para o painel dev. */
export function hiddenVariables(state: GameState) {
  return {
    seed: state.seed,
    rngState: state.rngState,
    queue: state.queue.length,
    devUsed: state.devUsed,
    stats: state.stats,
    requests: state.requests.map(
      (r) => `${r.debtor.short}: risco ${r.risk}, topa até ${r.maxRate}%, paciência ${r.patience}`,
    ),
    loans: state.loans
      .filter((l) => l.status === 'active')
      .map(
        (l) =>
          `${l.debtor.short}: risco ${l.risk}, quebrou ${l.broke ? 'sim' : 'não'}, ` +
          `paga ${r3(payChance(l))}, quebra ${r3(hazard(l))}`,
      ),
  };
}

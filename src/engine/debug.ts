import type { GameState } from './state';

/** Variáveis que o jogador não vê, para o painel dev. */
export function hiddenVariables(state: GameState): Record<string, string | number | boolean> {
  return {
    seed: state.seed,
    rngState: state.rngState,
    queue: state.queue.length,
    devUsed: state.devUsed,
  };
}

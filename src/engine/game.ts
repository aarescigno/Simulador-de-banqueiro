import { params } from '../content/params';
import { createRng, type Rng } from './rng';
import { SAVE_VERSION, type GameEvent, type GameState } from './state';

export type Decision = never;

export interface StepResult {
  state: GameState;
  events: GameEvent[];
}

export function newGame(seed: number): GameState {
  const rng = createRng(seed);
  return {
    saveVersion: SAVE_VERSION,
    seed: seed >>> 0,
    rngState: rng.state(),
    week: 1,
    cash: params.startingCash,
    queue: [{ week: 1, event: { type: 'gameStarted' } }],
    journal: [],
    devUsed: false,
  };
}

/**
 * Fecha a semana em andamento: aplica as decisões, resolve, registra o relatório
 * e abre a semana seguinte. Puro: não altera o estado recebido.
 */
export function step(
  prev: GameState,
  decisions: readonly Decision[] = [],
  rng: Rng = createRng(prev.rngState),
): StepResult {
  const state: GameState = structuredClone(prev);
  void decisions;
  const events: GameEvent[] = [];

  const due = state.queue.filter((q) => q.week <= state.week);
  state.queue = state.queue.filter((q) => q.week > state.week);
  for (const q of due) events.push(q.event);

  state.journal.push({ week: state.week, events, cash: state.cash });
  if (state.journal.length > params.journalWeeks) {
    state.journal.splice(0, state.journal.length - params.journalWeeks);
  }

  state.week += 1;
  state.rngState = rng.state();
  return { state, events };
}

export function schedule(state: GameState, week: number, event: GameEvent): GameState {
  const queue = [...state.queue, { week, event }].sort((a, b) => a.week - b.week);
  return { ...state, queue };
}

export function devGiveMoney(state: GameState, amount: number): GameState {
  return schedule({ ...state, cash: state.cash + amount, devUsed: true }, state.week, {
    type: 'devMoney',
    amount,
  });
}

export function advanceWeeks(state: GameState, weeks: number): GameState {
  let s = state;
  for (let i = 0; i < weeks; i++) s = step(s).state;
  return s;
}

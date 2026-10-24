import { params } from '../content/params';
import {
  canAccept,
  collect,
  generateRequests,
  makeLoan,
  validTerms,
  type LoanTerms,
} from './agiota';
import { createRng, type Rng } from './rng';
import { SAVE_VERSION, type GameEvent, type GameState } from './state';

export type Decision =
  ({ type: 'accept'; requestId: number } & LoanTerms) | { type: 'refuse'; requestId: number };

export interface StepResult {
  state: GameState;
  events: GameEvent[];
}

export function newGame(seed: number): GameState {
  const rng = createRng(seed);
  const state: GameState = {
    saveVersion: SAVE_VERSION,
    seed: seed >>> 0,
    rngState: 0,
    week: 1,
    cash: params.startingCash,
    requests: [],
    loans: [],
    nextId: 1,
    stats: { lent: 0, received: 0, writtenOff: 0 },
    queue: [{ week: 1, event: { type: 'gameStarted' } }],
    journal: [],
    devUsed: false,
  };
  state.requests = generateRequests(state, rng);
  state.rngState = rng.state();
  return state;
}

/**
 * Resposta a um pedido, aplicada na hora. O evento entra na fila e sai no
 * relatório desta semana. Decisões inválidas lançam erro.
 */
export function decide(prev: GameState, d: Decision): GameState {
  const req = prev.requests.find((r) => r.id === d.requestId);
  if (!req) throw new Error(`Pedido ${d.requestId} não existe.`);
  const state: GameState = structuredClone(prev);
  state.requests = state.requests.filter((r) => r.id !== d.requestId);
  if (d.type === 'refuse') {
    return schedule(state, state.week, { type: 'refused', name: req.debtor.short });
  }
  if (!canAccept(prev, d.requestId)) throw new Error('Caixa insuficiente.');
  if (!validTerms(d)) throw new Error('Taxa ou prazo fora dos limites.');
  const terms = { monthlyRate: d.monthlyRate, weeks: d.weeks };
  state.loans.push(makeLoan(state, req, terms));
  state.cash -= req.amount;
  state.stats.lent += req.amount;
  return schedule(state, state.week, {
    type: 'loanMade',
    name: req.debtor.short,
    amount: req.amount,
    ...terms,
  });
}

/**
 * Fecha a semana em andamento: aplica as decisões, cobra as parcelas, registra
 * o relatório e abre a semana seguinte com pedidos novos. Puro: não altera o
 * estado recebido.
 */
export function step(
  prev: GameState,
  decisions: readonly Decision[] = [],
  rng: Rng = createRng(prev.rngState),
): StepResult {
  let state = prev;
  for (const d of decisions) state = decide(state, d);
  state = structuredClone(state);
  const events: GameEvent[] = [];

  const due = state.queue.filter((q) => q.week <= state.week);
  state.queue = state.queue.filter((q) => q.week > state.week);
  for (const q of due) events.push(q.event);

  for (const req of state.requests) events.push({ type: 'expired', name: req.debtor.short });
  state.requests = [];

  for (const loan of state.loans) collect(state, loan, rng, events);

  state.journal.push({ week: state.week, events, cash: state.cash });
  if (state.journal.length > params.journalWeeks) {
    state.journal.splice(0, state.journal.length - params.journalWeeks);
  }

  state.week += 1;
  state.requests = generateRequests(state, rng);
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

/** Avança semanas sem responder pedidos (eles expiram). */
export function advanceWeeks(state: GameState, weeks: number): GameState {
  let s = state;
  for (let i = 0; i < weeks; i++) s = step(s).state;
  return s;
}

/** Quanto ainda falta receber dos empréstimos ativos. */
export function receivable(state: GameState): number {
  return state.loans
    .filter((l) => l.status === 'active')
    .reduce((sum, l) => sum + l.totalDue - l.totalPaid, 0);
}

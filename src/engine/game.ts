import { collection, params } from '../content/params';
import {
  canAccept,
  clampMeter,
  collect,
  forgive,
  generateRequests,
  makeLoan,
  tolerance,
  validTerms,
  type LoanTerms,
} from './agiota';
import { retire, tickCrisis } from './crisis';
import { emptyIncidents } from './incidents';
import { emptyPocket, stash, tickPocket, unstash } from './pocket';
import { applyChoice, resolveDefaults, tickIncidents } from './incidents';
import { complain, heatBand, tickPolice } from './police';
import { createRng, type Rng } from './rng';
import {
  SAVE_VERSION,
  type CollectionPolicy,
  type Compartment,
  type DilemmaOption,
  type GameEvent,
  type GameState,
  type Level,
} from './state';

export type Decision =
  | ({ type: 'accept'; requestId: number } & LoanTerms)
  | { type: 'refuse'; requestId: number }
  | { type: 'setPolicy'; collection: CollectionPolicy }
  | { type: 'setOverride'; loanId: number; override: Level | null }
  | { type: 'forgive'; loanId: number }
  | { type: 'choose'; dilemmaId: number; option: DilemmaOption }
  | { type: 'stash'; to: Compartment; amount: number }
  | { type: 'unstash'; from: Compartment; amount: number }
  | { type: 'retire' };

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
    stats: {
      lent: 0,
      received: 0,
      writtenOff: 0,
      recovered: 0,
      forgiven: 0,
      seized: 0,
      fees: 0,
      betrayed: 0,
      spent: 0,
      returned: 0,
    },
    policy: { collection: { ...collection.defaultPolicy } },
    fear: 0,
    word: collection.word.start,
    complaints: 0,
    police: { heat: 0, inquiry: null, cooldownUntil: 0, bribes: 0, raids: 0 },
    pocket: emptyPocket(),
    incidents: emptyIncidents(),
    dilemmas: [],
    crisis: null,
    ended: null,
    primoGone: false,
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
 * relatório desta semana. Proposta acima do que o devedor topa vira
 * contraproposta no pedido; sem paciência, ele vai embora. Decisões inválidas
 * lançam erro.
 */
export function decide(prev: GameState, d: Decision): GameState {
  if (prev.ended) throw new Error('A partida acabou.');
  if (d.type === 'retire') {
    const state = structuredClone(prev);
    retire(state);
    return state;
  }
  if (d.type === 'choose') {
    const state = structuredClone(prev);
    const event = applyChoice(state, d.dilemmaId, d.option);
    return event ? schedule(state, state.week, event) : state;
  }
  if (d.type === 'stash' || d.type === 'unstash') {
    const state = structuredClone(prev);
    const event =
      d.type === 'stash' ? stash(state, d.to, d.amount) : unstash(state, d.from, d.amount);
    return schedule(state, state.week, event);
  }
  if (d.type === 'setPolicy' || d.type === 'setOverride' || d.type === 'forgive') {
    return decideCollection(prev, d);
  }
  const req = prev.requests.find((r) => r.id === d.requestId);
  if (!req) throw new Error(`Pedido ${d.requestId} não existe.`);
  const state: GameState = structuredClone(prev);
  const pending = state.requests;
  state.requests = pending.filter((r) => r.id !== d.requestId);
  if (d.type === 'refuse') {
    return schedule(state, state.week, { type: 'refused', name: req.debtor.short });
  }
  if (!canAccept(prev, d.requestId)) throw new Error('Caixa insuficiente.');
  if (!validTerms(d)) throw new Error('Taxa ou prazo fora dos limites.');
  const collateral = d.collateral ?? null;
  if (collateral && !req.assets.some((a) => a.kind === collateral)) {
    throw new Error('O devedor não tem essa garantia.');
  }

  const max = tolerance(req, collateral);
  if (d.monthlyRate > max) {
    if (req.patience <= 0) {
      return schedule(state, state.week, { type: 'walkedOut', name: req.debtor.short });
    }
    const countered = { ...req, patience: req.patience - 1, counter: { rate: max, collateral } };
    state.requests = pending.map((r) => (r.id === req.id ? structuredClone(countered) : r));
    return state;
  }

  const terms = { monthlyRate: d.monthlyRate, weeks: d.weeks, collateral };
  state.loans.push(makeLoan(state, req, terms));
  state.cash -= req.amount;
  state.stats.lent += req.amount;
  state.word = clampMeter(
    state.word +
      collection.word.loanMade +
      (collateral === 'inss' ? collection.inss.wordOnLend : 0),
  );
  return schedule(state, state.week, {
    type: 'loanMade',
    name: req.debtor.short,
    amount: req.amount,
    ...terms,
  });
}

function validThreshold(t: number | null): boolean {
  return t === null || (Number.isInteger(t) && t >= 1 && t <= collection.maxThreshold);
}

/** Decisões sobre cobrança, aplicadas na hora. */
function decideCollection(
  prev: GameState,
  d: Extract<Decision, { type: 'setPolicy' | 'setOverride' | 'forgive' }>,
): GameState {
  const state = structuredClone(prev);
  if (d.type === 'setPolicy') {
    const c = d.collection;
    if (![c.conversa, c.pressao, c.primo].every(validThreshold)) {
      throw new Error('Limiar de cobrança inválido.');
    }
    state.policy = { collection: { ...c } };
    return state;
  }
  if (d.type === 'setOverride') {
    const loan = state.loans.find((l) => l.id === d.loanId);
    if (!loan) throw new Error(`Empréstimo ${d.loanId} não existe.`);
    loan.override = d.override;
    return state;
  }
  const events: GameEvent[] = [];
  forgive(state, d.loanId, events);
  return schedule(state, state.week, events[0]!);
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
  if (prev.ended) throw new Error('A partida acabou.');
  let state = prev;
  for (const d of decisions) state = decide(state, d);
  state = structuredClone(state);
  if (state.ended) return { state, events: [] };
  const events: GameEvent[] = [];

  const bandBefore = heatBand(state.police.heat);
  // Dilema sem resposta: vale a opção padrão de cada um.
  resolveDefaults(state, events);

  const due = state.queue.filter((q) => q.week <= state.week);
  state.queue = state.queue.filter((q) => q.week > state.week);
  for (const q of due) events.push(q.event);

  for (const req of state.requests) events.push({ type: 'expired', name: req.debtor.short });
  state.requests = [];

  const fear = state.fear;
  for (const loan of state.loans) collect(state, loan, rng, events, fear);

  const c = collection;
  complain(state, rng, events, c.fear.ambient * (state.fear / 100), 'ambiente');
  state.fear = clampMeter(state.fear * c.fear.decay);
  state.word = clampMeter(state.word + (c.word.start - state.word) * c.word.drift);

  tickPolice(state, rng, events, bandBefore);
  tickPocket(state, rng, events);
  tickIncidents(state, rng, events);
  tickCrisis(state, rng, events);

  state.journal.push({
    week: state.week,
    events,
    cash: state.cash,
    fear: state.fear,
    word: state.word,
    heat: state.police.heat,
  });
  if (state.journal.length > params.journalWeeks) {
    state.journal.splice(0, state.journal.length - params.journalWeeks);
  }

  if (!state.ended) {
    state.week += 1;
    state.requests = generateRequests(state, rng);
  }
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
  for (let i = 0; i < weeks && !s.ended; i++) s = step(s).state;
  return s;
}

/** Quanto ainda falta receber dos empréstimos ativos. */
export function receivable(state: GameState): number {
  return state.loans
    .filter((l) => l.status === 'active')
    .reduce((sum, l) => sum + l.totalDue - l.totalPaid, 0);
}

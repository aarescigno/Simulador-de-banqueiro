// Crise do degrau 1 (processo e jurado), saídas e finais da partida.
import { collection, crisis as C } from '../content/params';
import { generateRequests } from './agiota';
import { loseLoan, openTrial } from './police';
import { createRng, type Rng } from './rng';
import type { Dilemma, DilemmaOption, Ended, Ending, GameEvent, GameState } from './state';

const round100 = (x: number) => Math.round(x / 100) * 100;
const meter = (x: number) => Math.min(100, Math.max(0, x));

/** Preço de pagar o jurado: fração do caixa, arredondada a 100. */
export const payHitCost = (state: GameState) => round100(C.hit.payShare * state.cash);

/** Placar de cada final e o que entra nele. */
export function endingFor(state: GameState, kind: Ending): Ended {
  const p = state.pocket;
  const cash = kind === 'exilado' ? Math.round(state.cash * C.exile.cashShare) : state.cash;
  const parts: Ended['parts'] =
    kind === 'preso'
      ? [
          { part: 'laranja', amount: p.laranja },
          { part: 'offshore', amount: p.offshore },
        ]
      : kind === 'morto'
        ? [
            { part: 'own', amount: p.own },
            { part: 'blocked', amount: p.blocked },
            { part: 'offshore', amount: p.offshore },
          ]
        : kind === 'exilado'
          ? [
              { part: 'cash', amount: cash },
              { part: 'offshore', amount: p.offshore },
            ]
          : [
              { part: 'cash', amount: cash },
              { part: 'own', amount: p.own },
              { part: 'laranja', amount: p.laranja },
              { part: 'offshore', amount: p.offshore },
            ];
  const l = state.laundering;
  if (l) {
    const own = l.route === 'laranja';
    const counts = kind === 'aposentado' || (kind === 'preso' && own) || (kind === 'morto' && !own);
    if (counts) parts.push({ part: 'esc', amount: l.capital });
  }
  const score = parts.reduce((sum, x) => sum + x.amount, 0);
  return { kind, week: state.week, score, parts };
}

/** Encerra a partida. Muta o estado (cópia). */
export function endGame(state: GameState, kind: Ending): void {
  state.ended = endingFor(state, kind);
  state.crisis = null;
  state.dilemmas = [];
}

/** Aposenta o jogador; só vale a partir de `retireFromWeek`. Muta o estado (cópia). */
export function retire(state: GameState): void {
  if (state.week < C.retireFromWeek) throw new Error(`Só depois da semana ${C.retireFromWeek}.`);
  endGame(state, 'aposentado');
}

/** Abre o jurado: crise e dilema, para a semana seguinte. Muta o estado (cópia). */
export function openJurado(state: GameState, events: GameEvent[], dueWeek: number): void {
  if (state.crisis) throw new Error('Já há uma crise aberta.');
  state.crisis = {
    kind: 'jurado',
    startWeek: state.week,
    weeksLeft: C.hit.weeks,
    prisonChance: 0,
    lawyer: false,
  };
  const dilemma: Dilemma = {
    id: state.nextId++,
    kind: 'jurado',
    week: dueWeek,
    costs: { ficar: 0, pagar: payHitCost(state), sumir: 0, fugir: 0 },
  };
  state.dilemmas.push(dilemma);
  events.push({ type: 'crisisOpened', kind: 'jurado' });
}

/** Sumir por uns tempos: bairro novo, sem o caderninho. Muta o estado (cópia). */
function vanish(state: GameState): void {
  for (const loan of state.loans) if (loan.status === 'active') loseLoan(state, loan);
  state.week += C.vanish.weeks;
  state.crisis = null;
  state.dilemmas = [];
  state.fear = 0;
  state.word = collection.word.start;
  state.police.heat = 0;
  state.police.inquiry = null;
  const inc = state.incidents;
  inc.mesada = 0;
  inc.militia = 'none';
  inc.militiaRate = 0;
  inc.rivalUntil = 0;
  inc.primoOutUntil = 0;
  inc.scheduled = inc.scheduled.filter((s) => s.id !== 'jurado' && s.id !== 'milicia_recado');
  // Pedidos do bairro novo; o sorteio não mexe no RNG da partida.
  const rng = createRng((state.rngState ^ 0x5bd1e995) >>> 0);
  state.requests = generateRequests(state, rng);
}

/**
 * Escolha de um dilema de crise (o custo já foi cobrado). Muta o estado (cópia); devolve o evento.
 */
export function applyCrisisChoice(
  state: GameState,
  d: Dilemma,
  option: DilemmaOption,
  cost: number,
): GameEvent {
  const crisis = state.crisis;
  const event: GameEvent = {
    type: 'incidentChoice',
    id: d.kind,
    option,
    amount: cost > 0 ? cost : undefined,
  };
  if (option === 'fugir') {
    endGame(state, 'exilado');
    return event;
  }
  if (option === 'sumir') {
    vanish(state);
    return event;
  }
  switch (`${d.kind}/${option}`) {
    case 'processo/advogado':
      if (crisis) {
        crisis.lawyer = true;
        crisis.prisonChance = C.lawyer.prisonChance;
      }
      break;
    case 'processo/acordo':
      state.crisis = null;
      state.police.bribes += 1;
      state.police.heat = C.deal.heatAfter;
      break;
    case 'processo/entregar':
      state.crisis = null;
      state.primoGone = true;
      state.fear = meter(state.fear * C.snitch.fearAfter);
      state.police.heat = C.snitch.heatAfter;
      break;
    case 'jurado/pagar':
      state.crisis = null;
      state.incidents.militia = 'paying';
      state.incidents.militiaRate = C.hit.militiaRate;
      break;
    default:
      // processo/nada, jurado/ficar: segue a crise.
      break;
  }
  return event;
}

/**
 * Fim da semana, depois das ocorrências: avança a crise aberta. Processo: no julgamento, preso ou
 * absolvido. Jurado: chance de morte por semana; sobreviver às semanas acaba a crise.
 * A crise aberta nesta semana só começa a contar na próxima. Muta o estado (cópia).
 */
export function tickCrisis(state: GameState, rng: Rng, events: GameEvent[]): void {
  const c = state.crisis;
  if (!c || c.startWeek === state.week) return;
  if (c.kind === 'jurado') {
    if (rng.chance(C.hit.deathChance)) {
      endGame(state, 'morto');
      return;
    }
    c.weeksLeft -= 1;
    if (c.weeksLeft > 0) return;
    state.crisis = null;
    state.incidents.militia = 'paying';
    state.incidents.militiaRate = C.hit.militiaRate;
    events.push({ type: 'crisisEnded', kind: 'jurado', how: 'sobreviveu' });
    return;
  }
  c.weeksLeft -= 1;
  if (c.weeksLeft > 0) return;
  if (rng.chance(c.prisonChance)) {
    endGame(state, 'preso');
    return;
  }
  state.crisis = null;
  const pk = state.pocket;
  if (pk.blocked > 0) {
    events.push({ type: 'unblocked', amount: pk.blocked });
    pk.own += pk.blocked;
    pk.blocked = 0;
  }
  state.police.heat *= C.acquittedHeatAfter;
  events.push({ type: 'crisisEnded', kind: 'processo', how: 'absolvido' });
}

/** Painel dev: abre o processo agora, sem busca. O texto sai no Jornal desta semana. */
export function devForceTrial(prev: GameState): GameState {
  if (prev.crisis) throw new Error('Já há uma crise aberta.');
  const state = structuredClone(prev);
  const events: GameEvent[] = [];
  openTrial(state, events, state.week);
  state.devUsed = true;
  state.queue = [...state.queue, ...events.map((event) => ({ week: state.week, event }))].sort(
    (a, b) => a.week - b.week,
  );
  return state;
}

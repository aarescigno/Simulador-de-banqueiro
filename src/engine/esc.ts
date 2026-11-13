// Abrir a ESC: lavagem do capital em quatro rotas, venda do caderninho e a passagem ao degrau 2.
import { esc as E, pocket as pocketParams } from '../content/params';
import { laranjaFor } from '../content/pocket';
import type { GameEvent, GameState, Laundering, LaunderRoute, Loan } from './state';

const round100 = (x: number) => Math.round(x / 100) * 100;

/** Preço de uma rota: o que sai do caixa agora, o custo perdido, a comissão e o que vem do laranja. */
export interface LaunderQuote {
  outlay: number;
  /** Custo perdido (imposto, ponto, luva); vai para `stats.spent`. */
  cost: number;
  /** Comissão do laranja; vai para `stats.fees`. */
  fee: number;
  /** Quanto do capital já estava com o laranja. */
  fromLaranja: number;
}

/** A ESC pode ser escolhida agora? Inquérito aberto não impede. */
export function escAvailable(state: GameState): boolean {
  return (
    state.tier === 1 &&
    !state.ended &&
    state.week >= E.fromWeek &&
    state.laundering === null &&
    state.crisis === null
  );
}

/** Quanto custa cada rota, com o bolso de agora. */
export function launderQuote(state: GameState, route: LaunderRoute): LaunderQuote {
  const K = E.capital;
  if (route === 'consultoria') {
    const cost = Math.round(K * E.consultoria.tax);
    return { outlay: K + cost, cost, fee: 0, fromLaranja: 0 };
  }
  if (route === 'fachada') {
    const cost = E.fachada.setup + Math.round(K * E.fachada.tax);
    return { outlay: K + cost, cost, fee: 0, fromLaranja: 0 };
  }
  if (route === 'laranja') {
    const fromLaranja = Math.min(state.pocket.laranja, K);
    const rest = K - fromLaranja;
    const fee = Math.round(rest * pocketParams.laranja.fee);
    const cost = Math.round(K * E.laranja.signing);
    return { outlay: rest + fee + cost, cost, fee, fromLaranja };
  }
  return { outlay: 0, cost: 0, fee: 0, fromLaranja: 0 };
}

/** Escolhe a rota. Muta o estado (cópia); devolve o evento. */
export function launder(state: GameState, route: LaunderRoute): GameEvent {
  if (!escAvailable(state)) throw new Error('A ESC não está disponível agora.');
  const q = launderQuote(state, route);
  if (q.outlay > state.cash) throw new Error('Caixa insuficiente.');
  state.cash -= q.outlay;
  state.stats.spent += q.cost;
  state.stats.fees += q.fee;
  state.pocket.laranja -= q.fromLaranja;
  const weeks = route === 'devagar' ? null : E[route].weeks;
  state.laundering = {
    route,
    startWeek: state.week,
    capital: route === 'devagar' ? 0 : E.capital,
    readyWeek: weeks === null ? null : state.week + weeks,
  };
  return { type: 'laundered', route, cost: q.cost + q.fee, who: laranjaFor(state.seed).short };
}

/** O capital está limpo e a ESC pode abrir (falta só o resto das condições). */
export function escReady(state: GameState): boolean {
  const l = state.laundering;
  return l !== null && l.readyWeek !== null && state.week >= l.readyWeek;
}

/** O que impede de abrir a ESC agora, ou null. */
export function escOpenBlock(
  state: GameState,
): 'notReady' | 'crisis' | 'inquiry' | 'dilemma' | null {
  if (state.tier !== 1 || state.ended || !escReady(state)) return 'notReady';
  if (state.crisis) return 'crisis';
  if (state.police.inquiry) return 'inquiry';
  if (state.dilemmas.length > 0) return 'dilemma';
  return null;
}

/**
 * Fim da semana, depois da crise: o aviso da semana {fromWeek}, a transferência semanal do devagar
 * e o aviso de capital pronto. O RNG não é usado. Muta o estado (cópia).
 */
export function tickEsc(state: GameState, events: GameEvent[]): void {
  if (state.tier !== 1) return;
  if (state.week === E.fromWeek) events.push({ type: 'escAvailable' });
  const l = state.laundering;
  if (!l) return;
  if (l.route === 'devagar' && l.readyWeek === null) {
    const t = Math.max(0, Math.min(E.devagar.perWeek, E.capital - l.capital, state.cash));
    state.cash -= t;
    l.capital += t;
    if (l.capital >= E.capital) l.readyWeek = state.week + 1;
  }
  if (l.readyWeek === state.week + 1) events.push({ type: 'escReady', route: l.route });
}

/**
 * Busca com a fachada ainda não pronta: o capital vai para o bloqueio e a lavagem acaba. Deve
 * rodar antes de a busca mexer no bolso. Muta o estado (cópia).
 */
export function catchFachada(state: GameState, events: GameEvent[]): void {
  const l: Laundering | null = state.laundering;
  if (!l || l.route !== 'fachada' || escReady(state)) return;
  state.pocket.blocked += l.capital;
  state.laundering = null;
  events.push({ type: 'fachadaCaught', amount: l.capital });
}

/** O que o colega do ramo paga pelo caderninho: empréstimos na rua e preço. */
export function carteiraSale(state: GameState): { loans: Loan[]; price: number } {
  const loans = state.loans.filter((l) => l.status === 'active');
  const raw = loans.reduce(
    (sum, l) =>
      sum + (l.missedStreak === 0 ? E.sale.current : E.sale.late) * (l.totalDue - l.totalPaid),
    0,
  );
  return { loans, price: round100(raw) };
}

/** Abre a ESC: vende o caderninho, passa o resto ao bolso e vira o degrau 2. Muta o estado (cópia). */
export function openEsc(state: GameState): void {
  const block = escOpenBlock(state);
  if (block) throw new Error(`Não dá para abrir a ESC agora (${block}).`);
  const l = state.laundering!;
  const { loans, price } = carteiraSale(state);
  for (const loan of loans) {
    loan.status = 'sold';
    loan.endWeek = state.week;
  }
  state.cash += price;
  state.stats.sold += price;
  const leftover = state.cash;
  state.pocket.own += leftover;
  state.cash = l.capital;
  state.esc = {
    openedWeek: state.week,
    capital: l.capital,
    route: l.route,
    soldLoans: loans.length,
    sold: price,
    leftover,
    ficha: {
      weeks: state.week,
      complaints: state.complaints,
      raids: state.police.raids,
      bribes: state.police.bribes,
      heat: Math.round(state.police.heat),
      primoGone: state.primoGone,
      mesada: state.incidents.mesada > 0,
      militia: state.incidents.militia,
    },
  };
  state.tier = 2;
  state.laundering = null;
  state.requests = [];
}

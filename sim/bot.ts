// Bot simples: aceita todo pedido que cabe no caixa, sempre com a mesma taxa e prazo.
import { canAccept, step, type Decision, type GameState } from '../src/engine';

export interface BotOptions {
  monthlyRate: number;
  weeks: number;
  /** Recusa pedidos acima desta fração do caixa. */
  maxShare?: number;
}

export function botDecisions(state: GameState, o: BotOptions): Decision[] {
  const out: Decision[] = [];
  let cash = state.cash;
  for (const r of state.requests) {
    if (canAccept({ ...state, cash }, r.id) && r.amount <= cash * (o.maxShare ?? 1)) {
      out.push({ type: 'accept', requestId: r.id, monthlyRate: o.monthlyRate, weeks: o.weeks });
      cash -= r.amount;
    } else {
      out.push({ type: 'refuse', requestId: r.id });
    }
  }
  return out;
}

export function playBot(start: GameState, weeks: number, o: BotOptions): GameState {
  let s = start;
  for (let i = 0; i < weeks; i++) s = step(s, botDecisions(s, o)).state;
  return s;
}

// Bot simples: aceita todo pedido que cabe no caixa, sempre com a mesma taxa e prazo.
// Se o devedor contrapropõe, topa a contraproposta (ou não, conforme a opção).
import { canAccept, decide, step, type CollateralKind, type GameState } from '../src/engine';

export interface BotOptions {
  monthlyRate: number;
  weeks: number;
  /** Recusa pedidos acima desta fração do caixa. */
  maxShare?: number;
  /** Topa a contraproposta do devedor. Padrão: sim. */
  takeCounter?: boolean;
  /** Exige a garantia mais forte que o devedor tiver. */
  collateral?: boolean;
}

const strongest: CollateralKind[] = ['inss', 'moto', 'celular'];

/** Responde a todos os pedidos da semana. */
export function botDecide(state: GameState, o: BotOptions): GameState {
  let s = state;
  for (const r of state.requests) {
    if (!canAccept(s, r.id) || r.amount > s.cash * (o.maxShare ?? 1)) {
      s = decide(s, { type: 'refuse', requestId: r.id });
      continue;
    }
    const collateral = o.collateral
      ? (strongest.find((k) => r.assets.some((a) => a.kind === k)) ?? null)
      : null;
    const terms = { monthlyRate: o.monthlyRate, weeks: o.weeks, collateral };
    s = decide(s, { type: 'accept', requestId: r.id, ...terms });
    const counter = s.requests.find((x) => x.id === r.id)?.counter;
    if (counter && (o.takeCounter ?? true)) {
      s = decide(s, { type: 'accept', requestId: r.id, ...terms, monthlyRate: counter.rate });
    }
  }
  return s;
}

export function playBot(start: GameState, weeks: number, o: BotOptions): GameState {
  let s = start;
  for (let i = 0; i < weeks; i++) s = step(botDecide(s, o)).state;
  return s;
}

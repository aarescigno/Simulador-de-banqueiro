// Bolso: guardar dinheiro fora do caixa, retirar, e os riscos de cada compartimento.
import { laranjaFor } from '../content/pocket';
import { pocket as params } from '../content/params';
import type { Rng } from './rng';
import type { Compartment, GameEvent, GameState, Pocket } from './state';

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

export const emptyPocket = (): Pocket => ({
  own: 0,
  laranja: 0,
  offshore: 0,
  blocked: 0,
  blockedUntil: 0,
  doleiro: false,
});

/** Taxa de cada compartimento, na ida (stash) e na volta (unstash). */
export function stashFee(to: Compartment, amount: number): number {
  if (to === 'laranja') return Math.round(amount * params.laranja.fee);
  if (to === 'offshore') return Math.round(amount * params.offshore.fee);
  return 0;
}

export function unstashFee(from: Compartment, amount: number): number {
  return from === 'offshore' ? Math.round(amount * params.offshore.fee) : 0;
}

function checkAmount(amount: number): void {
  if (!Number.isInteger(amount) || amount < 1) throw new Error('Valor inválido.');
}

/** Tira do caixa e guarda. Muta o estado (cópia); devolve o evento. */
export function stash(state: GameState, to: Compartment, amount: number): GameEvent {
  checkAmount(amount);
  if (amount > state.cash) throw new Error('Caixa insuficiente.');
  if (to === 'offshore' && amount < params.offshore.min) {
    throw new Error('Remessa abaixo do mínimo.');
  }
  const fee = stashFee(to, amount);
  state.cash -= amount;
  state.pocket[to] += amount - fee;
  state.stats.fees += fee;
  if (to === 'offshore') state.pocket.doleiro = true;
  return { type: 'stashed', to, amount, fee, who: laranjaFor(state.seed).short };
}

/** Devolve ao caixa. Muta o estado (cópia); devolve o evento. */
export function unstash(state: GameState, from: Compartment, amount: number): GameEvent {
  checkAmount(amount);
  if (amount > state.pocket[from]) throw new Error('Saldo insuficiente.');
  const fee = unstashFee(from, amount);
  state.pocket[from] -= amount;
  state.cash += amount - fee;
  state.stats.fees += fee;
  return { type: 'unstashed', from, amount, fee, who: laranjaFor(state.seed).short };
}

/** O que está protegido: fora do caixa e fora do bloqueio. */
export function protectedWealth(state: GameState): number {
  const p = state.pocket;
  return p.own + p.laranja + p.offshore;
}

/** Chance semanal de o laranja sumir com tudo, dado o saldo. */
export function betrayChance(balance: number): number {
  const l = params.laranja;
  if (balance <= 0) return 0;
  return clamp(l.betrayScale * (balance / l.betrayRef) ** 2, 0, l.betrayMax);
}

/** Fim da semana, depois da polícia: desbloqueio, traição do laranja, doleiro preso. Muta o estado (cópia). */
export function tickPocket(state: GameState, rng: Rng, events: GameEvent[]): void {
  const p = state.pocket;
  if (p.blocked > 0 && state.week >= p.blockedUntil) {
    events.push({ type: 'unblocked', amount: p.blocked });
    p.own += p.blocked;
    p.blocked = 0;
  }
  if (p.laranja > 0 && rng.chance(betrayChance(p.laranja))) {
    state.stats.betrayed += p.laranja;
    events.push({ type: 'betrayed', amount: p.laranja, who: laranjaFor(state.seed).short });
    p.laranja = 0;
  }
  if (p.doleiro && rng.chance(params.offshore.caughtChance)) {
    state.police.heat = clamp(state.police.heat + params.offshore.caughtHeat, 0, 100);
    events.push({ type: 'doleiroCaught' });
  }
}

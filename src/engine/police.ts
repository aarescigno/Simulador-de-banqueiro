// Atenção policial, inquérito, busca e apreensão, e o dilema do inquérito.
import { police } from '../content/params';
import type { Rng } from './rng';
import type {
  Dilemma,
  DilemmaOption,
  GameEvent,
  GameState,
  HeatBand,
  ComplaintSource,
} from './state';

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
const meter = (x: number) => clamp(x, 0, 100);
const round100 = (x: number) => Math.round(x / 100) * 100;

const bandOrder: HeatBand[] = ['baixa', 'media', 'alta'];

export function heatBand(heat: number): HeatBand {
  if (heat >= police.bands.high) return 'alta';
  if (heat >= police.bands.medium) return 'media';
  return 'baixa';
}

export function bandRank(band: HeatBand): number {
  return bandOrder.indexOf(band);
}

/** Sorteia uma denúncia. Se sair, soma a atenção da origem e conta no inquérito aberto. Muta o estado (cópia). */
export function complain(
  state: GameState,
  rng: Rng,
  events: GameEvent[],
  chance: number,
  source: ComplaintSource,
  name?: string,
): void {
  if (!(chance > 0 && rng.chance(chance))) return;
  state.complaints += 1;
  state.police.heat = meter(state.police.heat + police.complaint[source]);
  if (state.police.inquiry) state.police.inquiry.complaints += 1;
  events.push({ type: 'complaint', source, name });
}

/** Chance de o inquérito virar busca e apreensão. */
export function raidChance(heat: number, complaints: number, lawyer: boolean): number {
  const i = police.inquiry;
  const evidence = (heat + i.perComplaint * complaints) * (lawyer ? i.lawyerFactor : 1);
  return clamp((evidence - i.raidOffset) / i.raidScale, i.raidMin, i.raidMax);
}

/** Preço de molhar a mão, com o caixa e as propinas de agora. */
export function bribeCost(cash: number, bribes: number): number {
  const b = police.bribe;
  return round100(Math.max(b.min, b.cashShare * cash) * b.growth ** bribes);
}

function raid(state: GameState, rng: Rng, events: GameEvent[]): void {
  const r = police.raid;
  const seized = Math.round(state.cash * r.cashShare);
  state.cash -= seized;
  state.stats.seized += seized;
  const lost: string[] = [];
  for (const loan of state.loans) {
    if (loan.status !== 'active') continue;
    const evidence = loan.collateral?.kind === 'inss';
    if (!(evidence || rng.chance(r.loanLoss))) continue;
    loan.status = 'lost';
    loan.endWeek = state.week;
    state.stats.writtenOff += loan.totalDue - loan.totalPaid;
    lost.push(loan.debtor.short);
  }
  state.fear = meter(state.fear * r.fearAfter);
  state.police.heat *= r.heatAfter;
  state.police.raids += 1;
  events.push({ type: 'raid', seized, lost });
}

function openInquiry(state: GameState, events: GameEvent[]): void {
  state.police.inquiry = {
    startWeek: state.week,
    weeksLeft: police.inquiry.weeks,
    lawyer: false,
    complaints: 0,
  };
  const dilemma: Dilemma = {
    id: state.nextId++,
    kind: 'inquerito',
    week: state.week + 1,
    costs: {
      pagar: bribeCost(state.cash, state.police.bribes),
      advogado: police.lawyer,
      correr: 0,
    },
  };
  state.dilemmas.push(dilemma);
  events.push({ type: 'inquiryOpened' });
}

/**
 * Fim da semana, depois de medo e boca a boca: atenção, faixa, e avanço, resolução ou abertura
 * de inquérito. `bandBefore` é a faixa no começo do `step`. Muta o estado (cópia).
 */
export function tickPolice(
  state: GameState,
  rng: Rng,
  events: GameEvent[],
  bandBefore: HeatBand,
): void {
  const p = state.police;
  p.heat = meter(
    p.heat * police.decay + Math.max(0, state.word - police.wordFloor) * police.wordWeight,
  );
  const band = heatBand(p.heat);
  if (bandRank(band) > bandRank(bandBefore)) events.push({ type: 'heatRose', band });

  if (p.inquiry) {
    p.inquiry.weeksLeft -= 1;
    if (p.inquiry.weeksLeft > 0) return;
    const { heat, inquiry } = p;
    if (rng.chance(raidChance(heat, inquiry.complaints, inquiry.lawyer))) {
      raid(state, rng, events);
    } else {
      p.heat *= police.archived.heatAfter;
      events.push({ type: 'inquiryArchived' });
    }
    p.inquiry = null;
    p.cooldownUntil = state.week + police.cooldown;
    return;
  }

  if (state.week < p.cooldownUntil) return;
  const chance = police.inquiryChance[band];
  if (chance > 0 && rng.chance(chance)) openInquiry(state, events);
}

/** Aplica a escolha do dilema. Muta o estado (cópia); devolve o evento, se houver. */
export function applyChoice(
  state: GameState,
  dilemmaId: number,
  option: DilemmaOption,
): GameEvent | null {
  const dilemma = state.dilemmas.find((d) => d.id === dilemmaId);
  if (!dilemma) throw new Error(`Dilema ${dilemmaId} não existe.`);
  const cost = dilemma.costs[option];
  if (cost === undefined) throw new Error('Opção inválida.');
  if (cost > state.cash) throw new Error('Caixa insuficiente.');
  state.dilemmas = state.dilemmas.filter((d) => d.id !== dilemmaId);
  state.cash -= cost;
  if (option === 'pagar') {
    state.police.inquiry = null;
    state.police.bribes += 1;
    state.police.cooldownUntil = state.week + police.cooldown;
    return { type: 'bribed', amount: cost };
  }
  if (option === 'advogado') {
    if (state.police.inquiry) state.police.inquiry.lawyer = true;
    return { type: 'lawyerHired', amount: cost };
  }
  return null;
}

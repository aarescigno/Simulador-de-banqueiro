// Atenção policial, inquérito, busca e apreensão, e o dilema do inquérito.
import {
  crisis as crisisParams,
  incidents,
  pocket as pocketParams,
  police,
} from '../content/params';
import type { Rng } from './rng';
import type {
  Dilemma,
  DilemmaOption,
  GameEvent,
  GameState,
  HeatBand,
  ComplaintSource,
  Loan,
} from './state';

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
const meter = (x: number) => clamp(x, 0, 100);
/** Soma direto na atenção (não é denúncia), entre 0 e 100. */
export function addHeat(state: GameState, delta: number): void {
  state.police.heat = meter(state.police.heat + delta);
}

/** Perde o empréstimo (busca, sumiço, tragédia): o saldo vira baixa. Muta o estado (cópia). */
export function loseLoan(state: GameState, loan: Loan): void {
  loan.status = 'lost';
  loan.endWeek = state.week;
  state.stats.writtenOff += loan.totalDue - loan.totalPaid;
}

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

/** Evidência do inquérito: atenção e denúncias, pela metade com advogado. */
export function evidenceOf(heat: number, complaints: number, lawyer: boolean): number {
  const i = police.inquiry;
  return (heat + i.perComplaint * complaints) * (lawyer ? i.lawyerFactor : 1);
}

/** Chance de o inquérito virar busca e apreensão. */
export function raidChance(heat: number, complaints: number, lawyer: boolean): number {
  const i = police.inquiry;
  return clamp(
    (evidenceOf(heat, complaints, lawyer) - i.raidOffset) / i.raidScale,
    i.raidMin,
    i.raidMax,
  );
}

/** Preço de acertar o processo com o delegado, com o caixa e as propinas de agora. */
export function dealCost(state: GameState): number {
  const d = crisisParams.deal;
  const base =
    Math.max(d.min, d.cashShare * state.cash) * police.bribe.growth ** state.police.bribes;
  return round100(base * (state.incidents.mesada > 0 ? d.mesadaDiscount : 1));
}

/** Abre o processo: crise e dilema, para a semana seguinte. Muta o estado (cópia). */
export function openTrial(state: GameState, events: GameEvent[], dueWeek: number): void {
  state.crisis = {
    kind: 'processo',
    startWeek: state.week,
    weeksLeft: crisisParams.trialWeeks,
    prisonChance: crisisParams.prisonChance,
    lawyer: false,
  };
  const costs: Record<string, number> = {
    nada: 0,
    advogado: crisisParams.lawyer.cost,
    acordo: dealCost(state),
  };
  if (!state.primoGone) costs.entregar = 0;
  costs.sumir = 0;
  costs.fugir = 0;
  state.dilemmas.push({ id: state.nextId++, kind: 'processo', week: dueWeek, costs });
  events.push({ type: 'crisisOpened', kind: 'processo' });
}

/** Preço de molhar a mão, com o caixa e as propinas de agora. */
export function bribeCost(cash: number, bribes: number): number {
  const b = police.bribe;
  return round100(Math.max(b.min, b.cashShare * cash) * b.growth ** bribes);
}

function raid(state: GameState, rng: Rng, events: GameEvent[], evidence: number): void {
  const r = police.raid;
  const seized = Math.round(state.cash * r.cashShare);
  state.cash -= seized;
  state.stats.seized += seized;
  const lost: string[] = [];
  for (const loan of state.loans) {
    if (loan.status !== 'active') continue;
    const evidence = loan.collateral?.kind === 'inss';
    if (!(evidence || rng.chance(r.loanLoss))) continue;
    loseLoan(state, loan);
    lost.push(loan.debtor.short);
  }
  const pk = state.pocket;
  if (pk.own > 0 || pk.blocked > 0) {
    pk.blocked += pk.own;
    pk.own = 0;
    pk.blockedUntil = state.week + pocketParams.block.weeks;
    events.push({ type: 'ownBlocked', amount: pk.blocked, until: pk.blockedUntil });
  }
  state.fear = meter(state.fear * r.fearAfter);
  state.police.heat *= r.heatAfter;
  state.police.raids += 1;
  events.push({ type: 'raid', seized, lost });
  const trial =
    state.police.raids >= crisisParams.raidsForTrial || evidence >= crisisParams.evidenceForTrial;
  if (trial && !state.crisis) openTrial(state, events, state.week + 1);
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
      raid(state, rng, events, evidenceOf(heat, inquiry.complaints, inquiry.lawyer));
    } else {
      p.heat *= police.archived.heatAfter;
      events.push({ type: 'inquiryArchived' });
    }
    p.inquiry = null;
    p.cooldownUntil = state.week + police.cooldown;
    return;
  }

  if (state.week < p.cooldownUntil || state.crisis) return;
  const factor =
    (state.incidents.mesada > 0 ? incidents.inquiryFactor.mesada : 1) *
    (state.week < state.incidents.vereadorUntil ? incidents.inquiryFactor.vereador : 1);
  const chance = police.inquiryChance[band] * factor;
  if (chance > 0 && rng.chance(chance)) openInquiry(state, events);
}

/** Escolha do dilema do inquérito. Muta o estado (cópia); devolve o evento, se houver. */
export function applyInquiryChoice(
  state: GameState,
  option: DilemmaOption,
  cost: number,
): GameEvent | null {
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

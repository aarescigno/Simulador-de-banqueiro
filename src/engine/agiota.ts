// Degrau 1: pedidos, empréstimos e parcelas semanais.
import { params, WEEKS_PER_MONTH } from '../content/params';
import { firstNames, professions, reasons, surnames, titleChance, titles } from '../content/people';
import type { Rng } from './rng';
import type {
  Collateral,
  CollateralKind,
  Debtor,
  GameEvent,
  GameState,
  Loan,
  LoanRequest,
} from './state';

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

export interface LoanTerms {
  monthlyRate: number;
  weeks: number;
  /** Garantia exigida, entre os bens do devedor. */
  collateral?: CollateralKind | null;
}

/** Juro simples ao mês, pago em parcelas semanais iguais (arredondadas para cima). */
export function quote(amount: number, { monthlyRate, weeks }: LoanTerms) {
  const total = amount * (1 + (monthlyRate / 100) * (weeks / WEEKS_PER_MONTH));
  const installment = Math.ceil(total / weeks);
  return { installment, totalDue: installment * weeks };
}

export function validTerms({ monthlyRate, weeks }: LoanTerms): boolean {
  const { rate, weeks: w } = params.terms;
  return (
    Number.isFinite(monthlyRate) &&
    Number.isInteger(weeks) &&
    monthlyRate >= rate.min &&
    monthlyRate <= rate.max &&
    weeks >= w.min &&
    weeks <= w.max
  );
}

export function canAccept(state: GameState, requestId: number): boolean {
  const req = state.requests.find((r) => r.id === requestId);
  return !!req && req.amount <= state.cash;
}

/** Maior taxa que o devedor topa com essa garantia. */
export function tolerance(req: LoanRequest, collateral: CollateralKind | null = null): number {
  const penalty = collateral ? params.collateral[collateral].ratePenalty : 0;
  return Math.max(params.terms.rate.min, req.maxRate - penalty);
}

export function makeLoan(state: GameState, req: LoanRequest, terms: LoanTerms): Loan {
  const { installment, totalDue } = quote(req.amount, terms);
  const collateral = req.assets.find((a) => a.kind === terms.collateral) ?? null;
  return {
    id: req.id,
    debtor: req.debtor,
    reason: req.reason,
    risk: req.risk,
    principal: req.amount,
    monthlyRate: terms.monthlyRate,
    weeks: terms.weeks,
    installment,
    totalDue,
    startWeek: state.week,
    paidInstallments: 0,
    totalPaid: 0,
    missedStreak: 0,
    broke: false,
    collateral: collateral && { ...collateral },
    recovered: 0,
    status: 'active',
  };
}

/** Chance de o devedor quebrar de vez nesta semana. */
export function hazard(loan: Pick<Loan, 'risk' | 'monthlyRate'>): number {
  const p = params.payment;
  return p.hazardBase + p.hazardRisk * loan.risk + p.hazardRate * (loan.monthlyRate / 100) ** 2;
}

/** Chance de pagar a parcela nesta semana. */
export function payChance(
  loan: Pick<Loan, 'risk' | 'monthlyRate' | 'broke'> & { collateral?: Collateral | null },
): number {
  const p = params.payment;
  const kind = loan.collateral?.kind;
  if (loan.broke) return kind === 'inss' ? params.collateral.inss.brokePay : p.brokePay;
  const bonus = kind ? params.collateral[kind].payBonus : 0;
  return clamp(
    p.base - p.riskWeight * loan.risk - p.rateWeight * (loan.monthlyRate / 100) + bonus,
    p.min,
    1,
  );
}

/** Resolve a semana de um empréstimo ativo. Muta o empréstimo e o estado recebidos (cópias). */
export function collect(state: GameState, loan: Loan, rng: Rng, events: GameEvent[]): void {
  const age = state.week - loan.startWeek;
  if (loan.status !== 'active' || age < 1) return;
  const owed = Math.min(loan.weeks, age) - loan.paidInstallments;
  if (owed <= 0) return;

  if (!loan.broke && rng.chance(hazard(loan))) loan.broke = true;
  const name = loan.debtor.short;

  if (rng.chance(payChance(loan))) {
    const n = owed > 1 && rng.chance(params.payment.catchUp) ? 2 : 1;
    const amount = Math.min(n * loan.installment, loan.totalDue - loan.totalPaid);
    loan.paidInstallments += n;
    loan.totalPaid += amount;
    loan.missedStreak = 0;
    state.cash += amount;
    state.stats.received += amount;
    events.push({ type: 'paid', name, amount });
    if (loan.paidInstallments >= loan.weeks) {
      loan.status = 'paid';
      loan.endWeek = state.week;
      events.push({ type: 'settled', name, profit: loan.totalPaid - loan.principal });
    }
    return;
  }

  loan.missedStreak += 1;
  if (loan.missedStreak >= params.payment.defaultAfterWeeks) {
    const owed = loan.totalDue - loan.totalPaid;
    const c = loan.collateral;
    const recovered = c
      ? Math.min(owed, Math.round(c.value * params.collateral[c.kind].recovery))
      : 0;
    const writtenOff = owed - recovered;
    loan.status = 'defaulted';
    loan.endWeek = state.week;
    loan.recovered = recovered;
    state.cash += recovered;
    state.stats.recovered += recovered;
    state.stats.writtenOff += writtenOff;
    events.push({ type: 'defaulted', name, writtenOff, recovered, collateral: c?.kind ?? null });
  } else {
    events.push({ type: 'missed', name, streak: loan.missedStreak });
  }
}

const roundTo = (x: number, step: number) => Math.round(x / step) * step;

function makeDebtor(
  rng: Rng,
  taken: Set<string>,
): { debtor: Debtor; professionRisk: number; assets: Collateral[] } {
  for (let attempt = 0; ; attempt++) {
    const sex = rng.chance(0.5) ? 'm' : 'f';
    const first = rng.pick(firstNames[sex]);
    const last = rng.pick(surnames);
    const title = rng.chance(titleChance) ? titles[sex] : '';
    const short = title ? `${title} ${first}` : first;
    const profession = rng.pick(professions);
    if (taken.has(short) && attempt < 8) continue;
    taken.add(short);
    const c = params.collateral;
    const assets: Collateral[] = [
      { kind: 'celular', value: roundTo(rng.int(c.celular.value[0], c.celular.value[1]), 50) },
    ];
    if (rng.chance(profession.moto ?? c.moto.chance)) {
      assets.push({ kind: 'moto', value: roundTo(rng.int(c.moto.value[0], c.moto.value[1]), 100) });
    }
    if (profession.inss) {
      assets.push({ kind: 'inss', value: roundTo(rng.int(c.inss.value[0], c.inss.value[1]), 10) });
    }
    return {
      assets,
      debtor: {
        name: `${first} ${last}`,
        short,
        initials: `${first[0]}${last[0]}`,
        profession: profession.name[sex],
      },
      professionRisk: profession.risk,
    };
  }
}

/** Pedidos que chegam no começo da semana. */
export function generateRequests(state: GameState, rng: Rng): LoanRequest[] {
  const { perWeek, baseRisk, riskClamp } = params.requests;
  const neg = params.negotiation;
  const taken = new Set([
    ...state.requests.map((r) => r.debtor.short),
    ...state.loans.filter((l) => l.status === 'active').map((l) => l.debtor.short),
  ]);
  const count = rng.int(perWeek[0], perWeek[1]);
  const out: LoanRequest[] = [];
  for (let i = 0; i < count; i++) {
    const { debtor, professionRisk, assets } = makeDebtor(rng, taken);
    const reason = rng.pick(reasons);
    const raw = rng.next() * baseRisk[0] + rng.next() * baseRisk[1] + professionRisk + reason.risk;
    const amount = roundTo(rng.int(reason.amount[0], reason.amount[1]), 100);
    const risk = Math.round(clamp(raw, riskClamp[0], riskClamp[1]) * 1000) / 1000;
    out.push({
      id: state.nextId++,
      week: state.week,
      debtor,
      amount,
      reason: reason.text,
      risk,
      assets,
      maxRate: Math.round(neg.base + neg.riskWeight * risk + rng.next() * neg.spread),
      patience: rng.int(neg.patience[0], neg.patience[1]),
    });
  }
  return out;
}

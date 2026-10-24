// Degrau 1: pedidos, empréstimos e parcelas semanais.
import { params, WEEKS_PER_MONTH } from '../content/params';
import { firstNames, professions, reasons, surnames, titleChance, titles } from '../content/people';
import type { Rng } from './rng';
import type { Debtor, GameEvent, GameState, Loan, LoanRequest } from './state';

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

export interface LoanTerms {
  monthlyRate: number;
  weeks: number;
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

export function makeLoan(state: GameState, req: LoanRequest, terms: LoanTerms): Loan {
  const { installment, totalDue } = quote(req.amount, terms);
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
    status: 'active',
  };
}

/** Chance de o devedor quebrar de vez nesta semana. */
export function hazard(loan: Pick<Loan, 'risk' | 'monthlyRate'>): number {
  const p = params.payment;
  return p.hazardBase + p.hazardRisk * loan.risk + p.hazardRate * (loan.monthlyRate / 100) ** 2;
}

/** Chance de pagar a parcela nesta semana. */
export function payChance(loan: Pick<Loan, 'risk' | 'monthlyRate' | 'broke'>): number {
  const p = params.payment;
  if (loan.broke) return p.brokePay;
  return clamp(
    p.base - p.riskWeight * loan.risk - p.rateWeight * (loan.monthlyRate / 100),
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
    const writtenOff = loan.totalDue - loan.totalPaid;
    loan.status = 'defaulted';
    loan.endWeek = state.week;
    state.stats.writtenOff += writtenOff;
    events.push({ type: 'defaulted', name, writtenOff });
  } else {
    events.push({ type: 'missed', name, streak: loan.missedStreak });
  }
}

function makeDebtor(rng: Rng, taken: Set<string>): { debtor: Debtor; professionRisk: number } {
  for (let attempt = 0; ; attempt++) {
    const sex = rng.chance(0.5) ? 'm' : 'f';
    const first = rng.pick(firstNames[sex]);
    const last = rng.pick(surnames);
    const title = rng.chance(titleChance) ? titles[sex] : '';
    const short = title ? `${title} ${first}` : first;
    const profession = rng.pick(professions);
    if (taken.has(short) && attempt < 8) continue;
    taken.add(short);
    return {
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
  const taken = new Set([
    ...state.requests.map((r) => r.debtor.short),
    ...state.loans.filter((l) => l.status === 'active').map((l) => l.debtor.short),
  ]);
  const count = rng.int(perWeek[0], perWeek[1]);
  const out: LoanRequest[] = [];
  for (let i = 0; i < count; i++) {
    const { debtor, professionRisk } = makeDebtor(rng, taken);
    const reason = rng.pick(reasons);
    const raw = rng.next() * baseRisk[0] + rng.next() * baseRisk[1] + professionRisk + reason.risk;
    const amount = Math.round(rng.int(reason.amount[0], reason.amount[1]) / 100) * 100;
    out.push({
      id: state.nextId++,
      week: state.week,
      debtor,
      amount,
      reason: reason.text,
      risk: Math.round(clamp(raw, riskClamp[0], riskClamp[1]) * 1000) / 1000,
    });
  }
  return out;
}

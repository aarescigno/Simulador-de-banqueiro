// Degrau 2: fichas de pequenas empresas, limite de capital, cobrança formal, distribuir e capitalizar.
// Tudo aqui é legal no 2a: ESC empresta capital próprio a MEI, micro e pequena da região.
import { cities, escReasons, pfReason, pfSegment, segments } from '../content/companies';
import {
  escLoans as P,
  params,
  pocket as pocketParams,
  police as policeParams,
} from '../content/params';
import { laranjaFor } from '../content/pocket';
import { firstNames, surnames, titleChance, titles } from '../content/people';
import { brokePayOf, clampMeter, type LoanTerms } from './agiota';
import { emptyIncidents } from './incidents';
import { stashFee } from './pocket';
import { createRng, type Rng } from './rng';
import type {
  Collateral,
  Company,
  Compartment,
  EscCollectionPolicy,
  EscLevel,
  GameEvent,
  GameState,
  Irregular,
  Loan,
  LoanRequest,
  LegalPorte,
} from './state';

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
const roundTo = (x: number, step: number) => Math.round(x / step) * step;
const round100 = (x: number) => roundTo(x, 100);

export const escLevelOrder: EscLevel[] = ['aviso', 'serasa', 'execucao'];

/** Nome da ficha ou do empréstimo nos eventos da ESC. */
export const requestName = (r: Pick<LoanRequest, 'company' | 'debtor'>) =>
  r.company?.name ?? r.debtor.short;

// ---------------------------------------------------------------------------------------------
// Entrar no degrau 2
// ---------------------------------------------------------------------------------------------

/**
 * A ESC vira o centro do jogo: o que era do caderninho (medo, milícia, mesada, rival, agenda) fica
 * na periferia. A ficha já guardou tudo. O sorteio das primeiras fichas usa um RNG derivado e não
 * mexe no `rngState` (o mesmo padrão do `vanish`). Muta o estado (cópia).
 */
export function enterEsc(state: GameState): void {
  state.fear = 0;
  state.word = P.word.start;
  state.incidents = emptyIncidents();
  state.dilemmas = [];
  state.police.inquiry = null;
  state.crisis = null;
  const rng = createRng((state.rngState ^ 0x2c1b3c6d) >>> 0);
  state.requests = generateEscRequests(state, rng);
  const esc = state.esc!;
  const event: GameEvent = {
    type: 'escOpened',
    route: esc.route,
    capital: esc.capital,
    who: laranjaFor(state.seed).short,
  };
  state.queue = [...state.queue, { week: state.week, event }].sort((a, b) => a.week - b.week);
}

// ---------------------------------------------------------------------------------------------
// Fichas
// ---------------------------------------------------------------------------------------------

function pickPorte(rng: Rng): LegalPorte {
  const entries = Object.entries(P.porte) as [LegalPorte, (typeof P.porte)[LegalPorte]][];
  const total = entries.reduce((s, [, v]) => s + v.weight, 0);
  let x = rng.next() * total;
  for (const [k, v] of entries) {
    x -= v.weight;
    if (x < 0) return k;
  }
  return entries[entries.length - 1]![0];
}

/**
 * Fichas que chegam no começo da semana. A ordem dos sorteios é fixa: porte, segmento, nome da
 * empresa, dono (sexo, nome, sobrenome, título), cidade, sinais (faturamento, anos, Serasa), motivo,
 * valor, risco (dois sorteios), taxa máxima, paciência e garantias (veículo, equipamento, recebíveis).
 */
export function generateEscRequests(state: GameState, rng: Rng): LoanRequest[] {
  const R = P.requests;
  const taken = new Set([
    ...state.requests.map((r) => requestName(r)),
    ...state.loans
      .filter((l) => l.status === 'active')
      .map((l) => l.company?.name ?? l.debtor.short),
  ]);
  const count = Math.min(
    R.maxTotal,
    rng.int(R.perWeek[0], R.perWeek[1]) + Math.floor(state.word / R.wordDivisor + rng.next()),
  );
  const out: LoanRequest[] = [];
  for (let i = 0; i < count; i++) {
    const porte = pickPorte(rng);
    const pp = P.porte[porte];
    const seg = rng.pick(segments);
    let name = '';
    for (let attempt = 0; attempt < 8; attempt++) {
      name = rng.pick(seg.names);
      if (!taken.has(name)) break;
    }
    taken.add(name);
    const sex = rng.chance(0.5) ? 'm' : 'f';
    const first = rng.pick(firstNames[sex]);
    const last = rng.pick(surnames);
    const title = rng.chance(titleChance) ? titles[sex] : '';
    const neighbor = rng.chance(R.neighborChance);
    const city = neighbor ? rng.pick(cities.neighbors) : cities.seat;
    const revenue = roundTo(rng.int(pp.revenue[0], pp.revenue[1]), 500);
    const years = rng.int(R.years[0], R.years[1]);
    const serasa = rng.chance(R.serasaChance);
    const reason = rng.pick(escReasons);
    const amount = roundTo(rng.int(pp.amount[0], pp.amount[1]), 500);
    const baseRnd = rng.next() * R.baseRisk[0] + rng.next() * R.baseRisk[1];
    const riskOf = (porteRisk: number, amt: number, rev: number | null) => {
      const raw =
        baseRnd +
        porteRisk +
        seg.risk +
        reason.risk +
        (serasa ? R.serasaRisk : 0) +
        (years < R.youngYears ? R.youngRisk : 0) +
        (rev ? R.leverageRisk * Math.max(0, amt / rev - R.leverageFree) : 0);
      return Math.round(clamp(raw, R.riskClamp[0], R.riskClamp[1]) * 1000) / 1000;
    };
    const neg = P.negotiation;
    const spread = rng.next() * neg.spread;
    const maxRateOf = (risk: number, bonus = 0) =>
      Math.max(1, Math.round(neg.base + neg.riskWeight * risk + spread) + bonus);
    let risk = riskOf(pp.risk, amount, revenue);
    let maxRate = maxRateOf(risk);
    const patience = rng.int(neg.patience[0], neg.patience[1]);
    const c = params.collateral;
    let assets: Collateral[] = [];
    if (rng.chance(seg.veiculo)) {
      assets.push({
        kind: 'veiculo',
        value: roundTo(rng.int(c.veiculo.value[0], c.veiculo.value[1]), 500),
      });
    }
    if (rng.chance(seg.equipamento)) {
      assets.push({
        kind: 'equipamento',
        value: roundTo(rng.int(c.equipamento.value[0], c.equipamento.value[1]), 500),
      });
    }
    if (rng.chance(seg.recebiveis)) {
      assets.push({ kind: 'recebiveis', value: round100(revenue * c.recebiveis.revenueShare) });
    }
    const company: Company = {
      name,
      segment: seg.label,
      porte,
      city,
      cityKind: neighbor ? 'vizinho' : 'sede',
      revenue,
      years,
      serasa,
    };
    let reasonText = reason.text;
    let amountFinal = amount;

    // Ficha irregular: o sorteio do tipo sai sempre, para a ordem do RNG ficar fixa.
    const I = P.irregular;
    const isIrregular = rng.chance(I.chance);
    const roll = rng.next();
    let irregular: Irregular | undefined;
    if (isIrregular) {
      irregular = roll < I.mix.pf ? 'pf' : roll < I.mix.pf + I.mix.area ? 'area' : 'media';
      if (irregular === 'pf') {
        amountFinal = roundTo(rng.int(I.pf.amount[0], I.pf.amount[1]), 500);
        company.name = `${first} ${last}`;
        company.segment = pfSegment;
        company.porte = 'pf';
        company.revenue = 0;
        company.years = 0;
        reasonText = pfReason;
        risk = riskOf(I.pf.risk, amountFinal, null);
        maxRate = maxRateOf(risk, I.pf.maxRate);
        assets = [];
        if (rng.chance(I.pf.veiculoChance)) {
          assets.push({
            kind: 'veiculo',
            value: roundTo(rng.int(c.veiculo.value[0], c.veiculo.value[1]), 500),
          });
        }
      } else if (irregular === 'area') {
        company.city = rng.pick(I.area.cities);
        company.cityKind = 'distante';
        risk = riskOf(pp.risk + I.area.risk, amount, revenue);
        maxRate = maxRateOf(risk, I.area.maxRate);
      } else {
        const m = I.media;
        amountFinal = roundTo(rng.int(m.amount[0], m.amount[1]), 500);
        const rev = roundTo(rng.int(m.revenue[0], m.revenue[1]), 5_000);
        company.porte = 'media';
        company.revenue = rev;
        risk = riskOf(m.risk, amountFinal, rev);
        maxRate = maxRateOf(risk);
        assets = [];
        if (rng.chance(m.veiculoChance)) {
          assets.push({
            kind: 'veiculo',
            value: roundTo(rng.int(c.veiculo.value[0], c.veiculo.value[1]), 500),
          });
        }
        if (rng.chance(m.recebiveisChance)) {
          assets.push({ kind: 'recebiveis', value: round100(rev * c.recebiveis.revenueShare) });
        }
      }
    }
    out.push({
      id: state.nextId++,
      week: state.week,
      debtor: {
        name: `${first} ${last}`,
        short: title ? `${title} ${first}` : first,
        initials: `${first[0]}${last[0]}`,
        profession: seg.label,
      },
      amount: amountFinal,
      reason: reasonText,
      risk,
      assets,
      maxRate,
      patience,
      company,
      ...(irregular ? { irregular } : {}),
    });
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// Limite de capital e lucro
// ---------------------------------------------------------------------------------------------

/** Principal ainda na rua de um empréstimo: a amortização é proporcional ao já pago. */
export function principalLeft(loan: Pick<Loan, 'principal' | 'totalDue' | 'totalPaid'>): number {
  return Math.round((loan.principal * (loan.totalDue - loan.totalPaid)) / loan.totalDue);
}

/** Total na rua, em principal. No degrau 2, todo ativo é da ESC. */
export const escBook = (state: GameState): number =>
  state.loans.filter((l) => l.status === 'active').reduce((s, l) => s + principalLeft(l), 0);

/** Quanto ainda cabe no capital declarado. */
export const escHeadroom = (state: GameState): number => state.esc!.capital - escBook(state);

/** A ficha cabe no limite e no caixa? */
export function escCanAccept(state: GameState, requestId: number): boolean {
  const req = state.requests.find((r) => r.id === requestId);
  return !!req && req.amount <= escHeadroom(state) && req.amount <= state.cash;
}

export function escValidTerms({ monthlyRate, weeks }: LoanTerms): boolean {
  const { rate, weeks: w } = P.terms;
  return (
    Number.isFinite(monthlyRate) &&
    Number.isInteger(weeks) &&
    monthlyRate >= rate.min &&
    monthlyRate <= rate.max &&
    weeks >= w.min &&
    weeks <= w.max
  );
}

/** O que passa do capital declarado e já está no caixa: só isso sai da ESC. */
export function distributable(state: GameState): number {
  if (!state.esc) return 0;
  const surplus = state.cash + escBook(state) - state.esc.capital;
  return Math.max(0, Math.min(state.cash, surplus));
}

function checkAmount(state: GameState, amount: number): void {
  if (!Number.isInteger(amount) || amount < 1) throw new Error('Valor inválido.');
  if (amount > distributable(state)) throw new Error('Passa do lucro distribuível.');
}

/** Lucro da ESC para o bolso, com a taxa do compartimento. Muta o estado (cópia); devolve o evento. */
export function distribute(state: GameState, to: Compartment, amount: number): GameEvent {
  checkAmount(state, amount);
  if (to === 'offshore' && amount < pocketParams.offshore.min) {
    throw new Error('Remessa abaixo do mínimo.');
  }
  const fee = stashFee(to, amount);
  state.cash -= amount;
  state.pocket[to] += amount - fee;
  state.stats.fees += fee;
  state.stats.distributed += amount;
  if (to === 'offshore') state.pocket.doleiro = true;
  return { type: 'distributed', to, amount, fee, who: laranjaFor(state.seed).short };
}

/** O lucro vira capital declarado: o limite sobe e o dinheiro não sai mais. Muta o estado (cópia). */
export function capitalize(state: GameState, amount: number): GameEvent {
  checkAmount(state, amount);
  state.esc!.capital += amount;
  return { type: 'capitalized', amount, capital: state.esc!.capital };
}

// ---------------------------------------------------------------------------------------------
// Cobrança
// ---------------------------------------------------------------------------------------------

/**
 * Passo de cobrança desta semana: o mais alto cujo limiar já chegou em `missedStreak`.
 * Sem atraso, nenhum.
 */
export function escLevelFor(
  policy: { escCollection: EscCollectionPolicy },
  loan: Pick<Loan, 'missedStreak'>,
): EscLevel | null {
  if (loan.missedStreak < 1) return null;
  let level: EscLevel | null = null;
  for (const l of escLevelOrder) {
    const t = policy.escCollection[l];
    if (t !== null && t <= loan.missedStreak) level = l;
  }
  return level;
}

/** Chance de a empresa quebrar de vez nesta semana. */
export function escHazard(loan: Pick<Loan, 'risk' | 'monthlyRate'>): number {
  const p = P.payment;
  return p.hazardBase + p.hazardRisk * loan.risk + p.hazardRate * (loan.monthlyRate / 100) ** 2;
}

/** Chance de pagar a parcela nesta semana. */
export function escPayChance(
  loan: Pick<Loan, 'risk' | 'monthlyRate' | 'broke'> & { collateral?: Collateral | null },
  level: EscLevel | null = null,
): number {
  const p = P.payment;
  const lv = level && level !== 'execucao' ? P.collection.levels[level] : null;
  const kind = loan.collateral?.kind;
  if (loan.broke) return Math.min(1, brokePayOf(kind, p.brokePay) + (lv?.brokePay ?? 0));
  const bonus = kind ? params.collateral[kind].payBonus : 0;
  return clamp(
    p.base -
      p.riskWeight * loan.risk -
      p.rateWeight * (loan.monthlyRate / 100) +
      bonus +
      (lv?.payBonus ?? 0),
    p.min,
    1,
  );
}

function executionRecovered(loan: Loan): { recovered: number; collateral: Collateral | null } {
  // Contrato fora do objeto da ESC: nem garantia nem penhora.
  if (loan.irregular) return { recovered: 0, collateral: null };
  const owed = loan.totalDue - loan.totalPaid;
  const c = loan.collateral;
  const E = P.collection.execution;
  const recovery = c ? params.collateral[c.kind].recovery : 0;
  const gross = c && recovery > 0 ? Math.min(owed, c.value * recovery) : owed * E.penhora;
  return { recovered: Math.round(gross * E.net), collateral: c && recovery > 0 ? c : null };
}

/** Quanto a execução recupera hoje; o mesmo número do `execute`, para a confirmação na tela. */
export const executionQuote = (loan: Loan): number => executionRecovered(loan).recovered;

/**
 * Execução na Justiça: encerra o contrato, retoma a garantia ou penhora o que achar; o advogado e
 * as custas ficam com o resto. Não usa o RNG. Muta o estado e o empréstimo (cópias).
 */
export function execute(state: GameState, loan: Loan, events: GameEvent[]): void {
  const owed = loan.totalDue - loan.totalPaid;
  const { recovered, collateral } = executionRecovered(loan);
  loan.status = 'defaulted';
  loan.endWeek = state.week;
  loan.recovered = recovered;
  state.cash += recovered;
  state.stats.recovered += recovered;
  state.stats.writtenOff += owed - recovered;
  state.word = clampMeter(state.word + P.collection.execution.word);
  events.push({
    type: 'executed',
    name: loan.company?.name ?? loan.debtor.short,
    recovered,
    writtenOff: owed - recovered,
    collateral: collateral?.kind ?? null,
    ...(loan.irregular ? { denied: true as const } : {}),
  });
}

/**
 * Resolve a semana de um empréstimo ativo da ESC. Mesma idade e parcelas devidas do degrau 1;
 * o passo de cobrança vem da política da ESC. Muta o empréstimo e o estado recebidos (cópias).
 */
export function collectEsc(state: GameState, loan: Loan, rng: Rng, events: GameEvent[]): void {
  const age = state.week - loan.startWeek;
  if (loan.status !== 'active' || age < 1) return;
  const owed = Math.min(loan.weeks, age) - loan.paidInstallments;
  if (owed <= 0) return;

  const name = loan.company?.name ?? loan.debtor.short;
  const level = escLevelFor(state.policy, loan);
  loan.escLevel = level;
  if (level === 'execucao') {
    execute(state, loan, events);
    return;
  }
  if (!loan.broke && rng.chance(escHazard(loan))) loan.broke = true;
  const pays = rng.chance(escPayChance(loan, level));
  if (level === 'serasa') {
    state.word = clampMeter(state.word + P.collection.levels.serasa.word);
  }

  if (pays) {
    const n = owed > 1 && rng.chance(P.payment.catchUp) ? 2 : 1;
    const amount = Math.min(n * loan.installment, loan.totalDue - loan.totalPaid);
    loan.paidInstallments += n;
    loan.totalPaid += amount;
    loan.missedStreak = 0;
    state.cash += amount;
    state.stats.received += amount;
    events.push({ type: 'paid', name, amount, escLevel: level });
    if (loan.paidInstallments >= loan.weeks) {
      loan.status = 'paid';
      loan.endWeek = state.week;
      state.word = clampMeter(state.word + P.word.settled);
      events.push({ type: 'settled', name, profit: loan.totalPaid - loan.principal });
    }
    return;
  }

  loan.missedStreak += 1;
  if (loan.missedStreak >= P.payment.defaultAfterWeeks) {
    // Ninguém foi buscar a garantia: calote sem execução, todo o saldo é baixa.
    const left = loan.totalDue - loan.totalPaid;
    loan.status = 'defaulted';
    loan.endWeek = state.week;
    loan.recovered = 0;
    state.stats.writtenOff += left;
    state.word = clampMeter(state.word + P.word.defaulted);
    events.push({ type: 'defaulted', name, writtenOff: left, recovered: 0, collateral: null });
  } else {
    events.push({ type: 'missed', name, streak: loan.missedStreak, escLevel: level });
  }
}

/** Atenção policial no degrau 2: só esfria. */
export function coolHeat(state: GameState): void {
  state.police.heat *= policeParams.decay;
}

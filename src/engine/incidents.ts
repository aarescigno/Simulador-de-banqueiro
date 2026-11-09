// Ocorrências: sorteio semanal, dilemas e notícias, e os efeitos contínuos (mesada, milícia, rival...).
import { crisis as C, incidents as P } from '../content/params';
import { applyCrisisChoice, openJurado } from './crisis';
import { addHeat, applyInquiryChoice, loseLoan } from './police';
import { createRng, type Rng } from './rng';
import type {
  Dilemma,
  DilemmaKind,
  DilemmaOption,
  GameEvent,
  GameState,
  IncidentId,
  Incidents,
  Loan,
} from './state';

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
const meter = (x: number) => clamp(x, 0, 100);

export const emptyIncidents = (): Incidents => ({
  last: {},
  scheduled: [],
  mesada: 0,
  militia: 'none',
  militiaRate: 0,
  rivalUntil: 0,
  primoOutUntil: 0,
  vereadorUntil: 0,
  shock: { until: 0, payDelta: 0 },
});

/** Opções de cada dilema; a primeira é a padrão, que vale quando o jogador não responde. */
export const dilemmaOptions: Partial<Record<DilemmaKind, readonly DilemmaOption[]>> = {
  inquerito: ['correr', 'pagar', 'advogado'],
  processo: ['nada', 'advogado', 'acordo', 'entregar', 'sumir', 'fugir'],
  jurado: ['ficar', 'pagar', 'sumir', 'fugir'],
  delegado: ['recusar', 'mesada'],
  milicia: ['pagar', 'recusar'],
  milicia_recado: ['pagar', 'recusar'],
  rival: ['ignorar', 'primo'],
  rolar: ['recusar', 'rolar'],
  bem: ['recusar', 'aceitar'],
  pastor: ['recusar', 'dar'],
  vereador: ['recusar', 'emprestar'],
  radio: ['ignorar', 'pagar'],
  fianca: ['deixar', 'pagar'],
  pm: ['recusar', 'emprestar'],
};

/** Opção padrão de um tipo de dilema. */
export function defaultOption(kind: DilemmaKind): DilemmaOption {
  return dilemmaOptions[kind]![0]!;
}

/** Ocorrências que viram escolha; as demais são notícias. */
export function isDilemma(id: IncidentId): boolean {
  return dilemmaOptions[id] !== undefined;
}

/** As 16 sorteáveis, na ordem do sorteio. */
export const drawable = [
  'delegado',
  'milicia',
  'rival',
  'rolar',
  'bem',
  'pastor',
  'vereador',
  'radio',
  'fianca',
  'pm',
  'assalto',
  'some',
  'tragedia',
  'gas',
  'decimo',
  'cartao',
] as const satisfies readonly IncidentId[];
export type DrawableId = (typeof drawable)[number];

/** As 4 de seguimento, só agendadas. */
export const followUps = ['milicia_recado', 'vereador_paga', 'pm_paga', 'jurado'] as const;

export const allIncidents: readonly IncidentId[] = [...drawable, ...followUps];

const isActive = (l: Loan) => l.status === 'active';

/** Empréstimos que cumprem o gatilho e ainda não são alvo de outro dilema. */
function loansWhere(state: GameState, test: (l: Loan) => boolean): Loan[] {
  const taken = new Set(state.dilemmas.map((d) => d.loanId));
  return state.loans.filter((l) => isActive(l) && !taken.has(l.id) && test(l));
}

const heatMedium = (s: GameState) => s.police.heat >= 20;

/** Gatilho das que não miram um devedor. */
const triggers: Partial<Record<DrawableId, (s: GameState) => boolean>> = {
  delegado: (s) => heatMedium(s) && s.incidents.mesada === 0,
  milicia: (s) => s.stats.received >= P.milicia.minReceived && s.incidents.militia === 'none',
  rival: (s) => s.week >= s.incidents.rivalUntil,
  radio: (s) => heatMedium(s) && s.complaints >= P.radio.minComplaints,
  fianca: (s) => s.loans.some((l) => isActive(l) && l.lastLevel === 'primo'),
  assalto: (s) => s.cash >= P.assalto.minCash,
  decimo: (s) => s.week >= P.decimo.minWeek,
};

/** Gatilho das que miram um devedor: os empréstimos candidatos. */
const targets: Partial<Record<DrawableId, (s: GameState) => Loan[]>> = {
  rolar: (s) => loansWhere(s, (l) => l.missedStreak >= P.rolar.minLate),
  bem: (s) => loansWhere(s, (l) => l.missedStreak >= P.bem.minLate),
  some: (s) => loansWhere(s, (l) => l.risk >= P.some.minRisk),
  tragedia: (s) =>
    loansWhere(
      s,
      (l) =>
        l.missedStreak >= P.tragedia.minLate &&
        l.lastLevel !== null &&
        P.tragedia.levels.includes(l.lastLevel),
    ),
  cartao: (s) => loansWhere(s, (l) => l.collateral?.kind === 'inss'),
};

export interface Eligible {
  id: DrawableId;
  /** Candidatos, nas ocorrências que miram um devedor. */
  loans?: Loan[];
}

function pendingIncidentDilemma(state: GameState): boolean {
  return state.crisis !== null || state.dilemmas.some((d) => d.kind !== 'inquerito');
}

/** Ocorrências sorteáveis agora: gatilho, semana mínima, repetição e um dilema por vez. */
export function eligibleIncidents(state: GameState): Eligible[] {
  const out: Eligible[] = [];
  for (const id of drawable) {
    const row = P[id];
    if (state.week < row.minWeek) continue;
    const last = state.incidents.last[id];
    if (last !== undefined && (row.cooldown === null || state.week - last < row.cooldown)) continue;
    if (isDilemma(id) && pendingIncidentDilemma(state)) continue;
    const pick = targets[id];
    if (pick) {
      const loans = pick(state);
      if (loans.length) out.push({ id, loans });
      continue;
    }
    if (triggers[id]?.(state) ?? true) out.push({ id });
  }
  return out;
}

const primoOut = (state: GameState, week: number) =>
  state.primoGone || week < state.incidents.primoOutUntil;

function costsFor(state: GameState, id: IncidentId, dueWeek: number): Record<string, number> {
  switch (id) {
    case 'pastor':
      return { recusar: 0, dar: P.pastor.cost };
    case 'vereador':
      return { recusar: 0, emprestar: P.vereador.cost };
    case 'radio':
      return { ignorar: 0, pagar: P.radio.cost };
    case 'fianca':
      return { deixar: 0, pagar: P.fianca.cost };
    case 'pm':
      return { recusar: 0, emprestar: P.pm.cost };
    case 'rival':
      return primoOut(state, dueWeek) ? { ignorar: 0 } : { ignorar: 0, primo: 0 };
    default:
      return Object.fromEntries((dilemmaOptions[id] ?? []).map((o) => [o, 0]));
  }
}

/** Valor que o texto do cartão mostra (preço da geladeira, mesada). */
function displayAmount(id: IncidentId, loan?: Loan): number | undefined {
  if (id === 'bem' && loan) return Math.round(P.bem.recovery * (loan.totalDue - loan.totalPaid));
  if (id === 'delegado') return P.delegado.mesada;
  return undefined;
}

function openDilemma(
  state: GameState,
  id: IncidentId,
  loan: Loan | undefined,
  events: GameEvent[],
  dueWeek: number,
): void {
  const dilemma: Dilemma = {
    id: state.nextId++,
    kind: id,
    week: dueWeek,
    costs: costsFor(state, id, dueWeek),
  };
  if (loan) dilemma.loanId = loan.id;
  const amount = displayAmount(id, loan);
  if (amount !== undefined) dilemma.amount = amount;
  state.dilemmas.push(dilemma);
  events.push({ type: 'incident', id, name: loan?.debtor.short, amount });
}

function setShock(state: GameState, payDelta: number, weeks: number): void {
  state.incidents.shock = { until: state.week + 1 + weeks, payDelta };
}

function applyNews(
  state: GameState,
  id: IncidentId,
  loan: Loan | undefined,
  rng: Rng,
  events: GameEvent[],
): void {
  const name = loan?.debtor.short;
  let amount: number | undefined;
  if (id === 'assalto') {
    amount = Math.round(state.cash * P.assalto.cashLoss);
    state.cash -= amount;
    state.stats.spent += amount;
  } else if (id === 'some' && loan) {
    loseLoan(state, loan);
    state.word = meter(state.word + P.some.word);
  } else if (id === 'tragedia' && loan) {
    loseLoan(state, loan);
    state.word = meter(state.word + P.tragedia.word);
    addHeat(state, P.tragedia.heat);
  } else if (id === 'gas') {
    setShock(state, P.gas.payDelta, P.gas.weeks);
  } else if (id === 'decimo') {
    setShock(state, P.decimo.payDelta, P.decimo.weeks);
  } else if (id === 'cartao' && loan) {
    loan.collateral = null;
  } else if (id === 'vereador_paga' || id === 'pm_paga') {
    const row = id === 'pm_paga' ? P.pm : P.vereador;
    amount = 0;
    if (rng.chance(row.payChance)) {
      amount = row.cost;
      state.cash += amount;
      state.stats.returned += amount;
    }
  }
  events.push({ type: 'incident', id, name, amount });
}

/** Dispara uma ocorrência: abre o dilema ou aplica a notícia. Muta o estado (cópia). */
export function startIncident(
  state: GameState,
  id: IncidentId,
  loan: Loan | undefined,
  rng: Rng,
  events: GameEvent[],
  dueWeek: number,
): void {
  state.incidents.last[id] = state.week;
  if (id === 'jurado') openJurado(state, events, dueWeek);
  else if (isDilemma(id)) openDilemma(state, id, loan, events, dueWeek);
  else applyNews(state, id, loan, rng, events);
}

function schedule(state: GameState, week: number, id: IncidentId): void {
  state.incidents.scheduled.push({ week, id });
}

function choice(d: Dilemma, option: DilemmaOption, loan?: Loan, amount?: number): GameEvent {
  return { type: 'incidentChoice', id: d.kind, option, name: loan?.debtor.short, amount };
}

function applyIncidentChoice(
  state: GameState,
  d: Dilemma,
  option: DilemmaOption,
): GameEvent | null {
  const inc = state.incidents;
  const w = state.week;
  const loan = d.loanId === undefined ? undefined : state.loans.find((l) => l.id === d.loanId);
  if (d.loanId !== undefined && (!loan || !isActive(loan))) return null;
  let amount: number | undefined;

  switch (`${d.kind}/${option}`) {
    case 'delegado/mesada':
      inc.mesada = P.delegado.mesada;
      addHeat(state, P.delegado.heatMesada);
      amount = P.delegado.mesada;
      break;
    case 'delegado/recusar':
      addHeat(state, P.delegado.heatRefuse);
      break;
    case 'milicia/pagar':
      inc.militia = 'paying';
      inc.militiaRate = P.milicia.rate;
      state.fear = meter(state.fear + P.milicia.fearPay);
      break;
    case 'milicia/recusar':
      inc.militia = 'refused';
      schedule(state, w + P.milicia.recadoWeeks, 'milicia_recado');
      break;
    case 'milicia_recado/pagar':
      inc.militia = 'paying';
      inc.militiaRate = P.milicia_recado.rate;
      break;
    case 'milicia_recado/recusar':
      schedule(state, w + C.hit.delay, 'jurado');
      amount = Math.round(state.cash * P.milicia_recado.cashLoss);
      state.cash -= amount;
      state.stats.spent += amount;
      state.fear *= P.milicia_recado.fearFactor;
      inc.militia = 'refusedTwice';
      inc.primoOutUntil = w + 1 + P.milicia_recado.primoOutWeeks;
      break;
    case 'rival/ignorar':
      inc.rivalUntil = w + 1 + P.rival.weeks;
      break;
    case 'rival/primo':
      addHeat(state, P.rival.heatPrimo);
      state.fear = meter(state.fear + P.rival.fearPrimo);
      break;
    case 'rolar/rolar': {
      if (!loan) break;
      const late = Math.min(loan.weeks, w - loan.startWeek) - loan.paidInstallments;
      const n = clamp(late, 1, P.rolar.maxCatchUp);
      const paid = Math.min(n * loan.installment, loan.totalDue - loan.totalPaid);
      loan.paidInstallments += n;
      loan.totalPaid += paid;
      state.stats.lent += paid;
      state.stats.received += paid;
      loan.weeks += P.rolar.extraWeeks;
      loan.totalDue += P.rolar.extraWeeks * loan.installment;
      loan.missedStreak = 0;
      amount = paid;
      break;
    }
    case 'bem/aceitar': {
      if (!loan) break;
      const owed = loan.totalDue - loan.totalPaid;
      const got = Math.round(P.bem.recovery * owed);
      loan.status = 'defaulted';
      loan.endWeek = w;
      loan.recovered = got;
      state.cash += got;
      state.stats.recovered += got;
      state.stats.writtenOff += owed - got;
      state.fear = meter(state.fear + P.bem.fear);
      state.word = meter(state.word + P.bem.word);
      amount = got;
      break;
    }
    case 'pastor/recusar':
      state.word = meter(state.word + P.pastor.wordRefuse);
      break;
    case 'pastor/dar':
      state.word = meter(state.word + P.pastor.wordGive);
      addHeat(state, P.pastor.heatGive);
      amount = P.pastor.cost;
      break;
    case 'vereador/emprestar':
      inc.vereadorUntil = w + 1 + P.vereador.weeks;
      schedule(state, w + P.vereador.weeks, 'vereador_paga');
      amount = P.vereador.cost;
      break;
    case 'radio/ignorar':
      addHeat(state, P.radio.heatIgnore);
      state.word = meter(state.word + P.radio.wordIgnore);
      break;
    case 'radio/pagar':
      addHeat(state, P.radio.heatPay);
      amount = P.radio.cost;
      break;
    case 'fianca/deixar':
      inc.primoOutUntil = w + 1 + P.fianca.primoOutWeeks;
      addHeat(state, P.fianca.heatLeave);
      break;
    case 'fianca/pagar':
      amount = P.fianca.cost;
      break;
    case 'pm/recusar':
      addHeat(state, P.pm.heatRefuse);
      break;
    case 'pm/emprestar':
      addHeat(state, P.pm.heatLend);
      schedule(state, w + P.pm.weeks, 'pm_paga');
      amount = P.pm.cost;
      break;
    default:
      // vereador/recusar, rolar/recusar, bem/recusar: nada além do texto.
      break;
  }
  return choice(d, option, loan, amount);
}

/**
 * Aplica a escolha de um dilema pendente (de qualquer tipo): cobra o custo e despacha por tipo.
 * Muta o estado (cópia); devolve o evento, se houver.
 */
export function applyChoice(
  state: GameState,
  dilemmaId: number,
  option: DilemmaOption,
): GameEvent | null {
  const dilemma = state.dilemmas.find((d) => d.id === dilemmaId);
  if (!dilemma) throw new Error(`Dilema ${dilemmaId} não existe.`);
  if (!Object.hasOwn(dilemma.costs, option)) throw new Error('Opção inválida.');
  const cost = dilemma.costs[option]!;
  if (cost > state.cash) throw new Error('Caixa insuficiente.');
  state.dilemmas = state.dilemmas.filter((d) => d.id !== dilemmaId);
  state.cash -= cost;
  state.stats.spent += cost;
  if (dilemma.kind === 'inquerito') return applyInquiryChoice(state, option, cost);
  if (dilemma.kind === 'processo' || dilemma.kind === 'jurado') {
    return applyCrisisChoice(state, dilemma, option, cost);
  }
  return applyIncidentChoice(state, dilemma, option);
}

/** Dilemas sem resposta: vale a opção padrão de cada um. Muta o estado (cópia). */
export function resolveDefaults(state: GameState, events: GameEvent[]): void {
  for (const d of [...state.dilemmas]) {
    const event = applyChoice(state, d.id, defaultOption(d.kind));
    if (event) events.push(event);
  }
}

/** Soma o que entrou de parcelas nos eventos da semana. */
function receivedIn(events: GameEvent[]): number {
  let sum = 0;
  for (const e of events) if (e.type === 'paid') sum += e.amount;
  return sum;
}

function payContinuing(state: GameState, events: GameEvent[]): void {
  const inc = state.incidents;
  if (inc.mesada > 0) {
    if (state.cash >= inc.mesada) {
      state.cash -= inc.mesada;
      state.stats.spent += inc.mesada;
    } else {
      inc.mesada = 0;
      addHeat(state, P.delegado.heatFail);
      events.push({ type: 'mesadaFailed' });
    }
  }
  if (inc.militia === 'paying') {
    const cut = Math.min(state.cash, Math.round(inc.militiaRate * receivedIn(events)));
    if (cut > 0) {
      state.cash -= cut;
      state.stats.spent += cut;
      events.push({ type: 'militiaCut', amount: cut });
    }
  }
}

function drawWeighted(list: Eligible[], rng: Rng): Eligible {
  const total = list.reduce((s, e) => s + P[e.id].weight, 0);
  let r = rng.next() * total;
  for (const e of list) {
    r -= P[e.id].weight;
    if (r < 0) return e;
  }
  return list[list.length - 1]!;
}

/**
 * Fim da semana, depois da polícia e do bolso: paga os efeitos contínuos, dispara as ocorrências
 * agendadas e, com chance `chance`, sorteia uma nova. Dilemas valem para a semana seguinte.
 * Muta o estado (cópia).
 */
export function tickIncidents(state: GameState, rng: Rng, events: GameEvent[]): void {
  payContinuing(state, events);

  const due = state.incidents.scheduled.filter((s) => s.week <= state.week);
  state.incidents.scheduled = state.incidents.scheduled.filter((s) => s.week > state.week);
  for (const s of due) {
    if (s.id === 'jurado') {
      // O recado só vale se a milícia segue de mal; com outra crise aberta, espera uma semana.
      if (state.incidents.militia !== 'refusedTwice') continue;
      if (state.crisis) {
        state.incidents.scheduled.push({ week: state.week + 1, id: 'jurado' });
        continue;
      }
    }
    const loan = s.loanId === undefined ? undefined : state.loans.find((l) => l.id === s.loanId);
    startIncident(state, s.id, loan, rng, events, state.week + 1);
  }

  if (!rng.chance(P.chance)) return;
  const list = eligibleIncidents(state);
  if (!list.length) return;
  const picked = drawWeighted(list, rng);
  const loan = picked.loans ? rng.pick(picked.loans) : undefined;
  startIncident(state, picked.id, loan, rng, events, state.week + 1);
}

/**
 * Painel dev: dispara uma ocorrência agora, sem sorteio. Dilema entra pendente nesta semana;
 * notícia aplica na hora; o texto sai no Jornal desta semana.
 */
export function devForceIncident(prev: GameState, id: IncidentId): GameState {
  const state = structuredClone(prev);
  const rng = createRng(state.rngState);
  const events: GameEvent[] = [];
  let loan: Loan | undefined;
  const pick = (id in targets ? targets[id as DrawableId] : undefined)?.(state);
  const needsLoan = id in targets;
  if (needsLoan) {
    loan = pick?.[0] ?? loansWhere(state, () => true)[0];
    if (!loan) throw new Error('Sem empréstimo ativo para esta ocorrência.');
  }
  startIncident(state, id, loan, rng, events, state.week);
  state.rngState = rng.state();
  state.devUsed = true;
  const queue = [...state.queue, ...events.map((event) => ({ week: state.week, event }))];
  state.queue = queue.sort((a, b) => a.week - b.week);
  return state;
}

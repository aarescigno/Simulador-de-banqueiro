import { describe, expect, it } from 'vitest';
import { crisis as C } from '../src/content/params';
import { crisisDilemmaTexts, crisisLine, endingTexts } from '../src/content/endings';
import { reportLines } from '../src/content/journal';
import { generateRequests, levelFor, makeLoan } from '../src/engine/agiota';
import { endingFor, tickCrisis } from '../src/engine/crisis';
import { decide, newGame, step } from '../src/engine/game';
import {
  applyChoice,
  defaultOption,
  devForceIncident,
  dilemmaOptions,
  eligibleIncidents,
  tickIncidents,
} from '../src/engine/incidents';
import { protectedWealth } from '../src/engine/pocket';
import { dealCost, tickPolice } from '../src/engine/police';
import type { Rng } from '../src/engine/rng';
import { deserialize, serialize } from '../src/engine/save';
import type { Ending, GameEvent, GameState, Loan } from '../src/engine/state';
import { devForceTrial } from '../src/engine/crisis';
import { playBot } from '../sim/bot';

function fixedRng(x: number): Rng {
  return {
    next: () => x,
    int: (min) => min,
    chance: (p) => x < p,
    pick: (items) => items[0]!,
    state: () => 0,
  };
}
const NEVER = fixedRng(0.999);
const ALWAYS = fixedRng(0);

/** Partida na semana 10, sem pedidos, com um empréstimo ativo e R$ 40 mil. */
function base(week = 10): { s: GameState; loan: Loan } {
  const s = newGame(1);
  const loan = makeLoan(s, s.requests[0]!, { monthlyRate: 20, weeks: 8, collateral: null });
  loan.startWeek = 1;
  return { s: { ...s, week, requests: [], loans: [loan], cash: 40_000 }, loan };
}

/** Inquérito na última semana, pronto para resolver em busca (rng 0 passa a chance). */
function raidSetup(opts: { heat?: number; raids?: number; complaints?: number; lawyer?: boolean }) {
  const { s } = base(10);
  s.police.heat = opts.heat ?? 30;
  s.police.raids = opts.raids ?? 0;
  s.police.inquiry = {
    startWeek: 6,
    weeksLeft: 1,
    lawyer: opts.lawyer ?? false,
    complaints: opts.complaints ?? 0,
  };
  return s;
}

function openTrialBy(s: GameState): GameEvent[] {
  const events: GameEvent[] = [];
  tickPolice(s, ALWAYS, events, 'baixa');
  return events;
}

function trial(s: GameState) {
  return s.dilemmas.find((d) => d.kind === 'processo');
}

function chooseOn(s: GameState, kind: 'processo' | 'jurado', option: string): GameState {
  const d = s.dilemmas.find((x) => x.kind === kind)!;
  return decide(s, { type: 'choose', dilemmaId: d.id, option });
}

/** Processo recém-aberto, ainda na semana 10 (antes de o `step` virar a semana). */
function rawTrial(): GameState {
  const s = raidSetup({ raids: 1 });
  openTrialBy(s);
  expect(s.crisis?.kind).toBe('processo');
  return s;
}

/** Processo aberto, na semana 11, com o dilema pendente. */
function withTrial(): GameState {
  const s = rawTrial();
  s.week += 1;
  return s;
}

function rawHit(): GameState {
  const { s } = base(10);
  s.incidents.militia = 'refusedTwice';
  startJurado(s);
  return s;
}

/** Jurado aberto, na semana 11, com o dilema pendente. */
function withHit(): GameState {
  const s = rawHit();
  s.week += 1;
  return s;
}

function startJurado(s: GameState) {
  s.incidents.scheduled = [{ week: s.week, id: 'jurado' }];
  tickIncidents(s, NEVER, []);
}

describe('processo: gatilhos', () => {
  it('a segunda busca abre o processo', () => {
    const s = raidSetup({ raids: 1, heat: 0 });
    const events = openTrialBy(s);
    expect(s.police.raids).toBe(2);
    expect(s.crisis).toEqual({
      kind: 'processo',
      startWeek: 10,
      weeksLeft: C.trialWeeks,
      prisonChance: C.prisonChance,
      lawyer: false,
    });
    expect(events.map((e) => e.type)).toContain('crisisOpened');
    expect(trial(s)!.week).toBe(11);
  });

  it('evidência de 60 ou mais abre o processo já na primeira busca', () => {
    const s = raidSetup({ heat: 70 });
    openTrialBy(s);
    expect(s.police.raids).toBe(1);
    expect(s.crisis?.kind).toBe('processo');
  });

  it('a evidência conta com o desconto do advogado', () => {
    const s = raidSetup({ heat: 70, lawyer: true });
    openTrialBy(s);
    expect(s.crisis).toBeNull();
  });

  it('primeira busca com evidência baixa não abre', () => {
    const s = raidSetup({ heat: 30, complaints: 1 });
    openTrialBy(s);
    expect(s.police.raids).toBe(1);
    expect(s.crisis).toBeNull();
    expect(trial(s)).toBeUndefined();
  });

  it('a busca aplica seus efeitos de sempre junto com a crise', () => {
    const s = raidSetup({ raids: 1 });
    openTrialBy(s);
    expect(s.stats.seized).toBe(20_000);
    expect(s.cash).toBe(20_000);
  });

  it('com crise aberta, nova busca não abre outra', () => {
    const s = withTrial();
    const before = s.crisis!.startWeek;
    s.police.inquiry = { startWeek: 6, weeksLeft: 1, lawyer: false, complaints: 0 };
    s.week = 12;
    openTrialBy(s);
    expect(s.crisis!.startWeek).toBe(before);
    expect(s.dilemmas.filter((d) => d.kind === 'processo')).toHaveLength(1);
  });

  it('com crise aberta, não abre inquérito nem dilema de ocorrência; chega 1 pedido a menos', () => {
    const s = withTrial();
    s.dilemmas = [];
    s.police.heat = 100;
    s.police.cooldownUntil = 0;
    s.week = 12;
    tickPolice(s, ALWAYS, [], 'alta');
    expect(s.police.inquiry).toBeNull();
    s.cash = 50_000;
    expect(eligibleIncidents(s).some((e) => e.id === 'pastor' || e.id === 'rival')).toBe(false);
    const free = { ...s, crisis: null };
    const a = generateRequests(free, fixedRng(0.99)).length;
    const b = generateRequests(s, fixedRng(0.99)).length;
    expect(b).toBe(Math.max(0, a - 1));
  });
});

describe('processo: opções', () => {
  it('o dilema tem as seis opções, a primeira é a padrão, com os preços', () => {
    const s = withTrial();
    const d = trial(s)!;
    expect(Object.keys(d.costs)).toEqual([...dilemmaOptions.processo!]);
    expect(defaultOption('processo')).toBe('nada');
    expect(d.costs).toEqual({
      nada: 0,
      advogado: C.lawyer.cost,
      acordo: dealCost(s),
      entregar: 0,
      sumir: 0,
      fugir: 0,
    });
  });

  it('o preço do acordo: 40% do caixa (mínimo 8 mil), × 1,5 por propina, metade com mesada', () => {
    const s = base(10).s;
    s.cash = 100_000;
    expect(dealCost(s)).toBe(40_000);
    s.cash = 10_000;
    expect(dealCost(s)).toBe(8_000);
    s.police.bribes = 2;
    expect(dealCost(s)).toBe(18_000);
    s.incidents.mesada = 600;
    expect(dealCost(s)).toBe(9_000);
  });

  it('nada: segue a crise', () => {
    const s = chooseOn(withTrial(), 'processo', 'nada');
    expect(s.crisis!.weeksLeft).toBe(C.trialWeeks);
    expect(s.cash).toBe(20_000);
  });

  it('advogado: cobra e baixa a chance de condenação', () => {
    const s0 = withTrial();
    const s = chooseOn(s0, 'processo', 'advogado');
    expect(s.cash).toBe(s0.cash - C.lawyer.cost);
    expect(s.stats.spent).toBe(C.lawyer.cost);
    expect(s.crisis).toMatchObject({ lawyer: true, prisonChance: C.lawyer.prisonChance });
  });

  it('acordo: cobra, acaba a crise, propina + 1, atenção em 40', () => {
    const s0 = withTrial();
    const cost = trial(s0)!.costs.acordo!;
    const s = chooseOn(s0, 'processo', 'acordo');
    expect(s.cash).toBe(s0.cash - cost);
    expect(s.stats.spent).toBe(cost);
    expect(s.crisis).toBeNull();
    expect(s.police.bribes).toBe(1);
    expect(s.police.heat).toBe(C.deal.heatAfter);
  });

  it('acordo sem caixa lança erro', () => {
    const s = withTrial();
    s.cash = 100;
    expect(() => chooseOn(s, 'processo', 'acordo')).toThrow();
  });

  it('entregar: primo vira pressão para sempre, medo × 0,3, atenção em 30', () => {
    const s0 = withTrial();
    s0.fear = 80;
    const s = chooseOn(s0, 'processo', 'entregar');
    expect(s.crisis).toBeNull();
    expect(s.primoGone).toBe(true);
    expect(s.fear).toBeCloseTo(80 * C.snitch.fearAfter);
    expect(s.police.heat).toBe(C.snitch.heatAfter);
    expect(s.cash).toBe(s0.cash);
  });

  it('sumir: oito semanas, caderninho perdido, medidores e efeitos zerados', () => {
    const s0 = withTrial();
    s0.fear = 70;
    s0.word = 80;
    s0.incidents.mesada = 600;
    s0.incidents.militia = 'paying';
    s0.incidents.militiaRate = 0.1;
    s0.incidents.rivalUntil = 30;
    s0.incidents.primoOutUntil = 30;
    s0.pocket.own = 5_000;
    s0.pocket.blocked = 7_000;
    s0.pocket.blockedUntil = 24;
    s0.pocket.laranja = 3_000;
    s0.police.inquiry = { startWeek: 9, weeksLeft: 2, lawyer: false, complaints: 1 };
    const owed = s0.loans[0]!.totalDue - s0.loans[0]!.totalPaid;
    const s = chooseOn(s0, 'processo', 'sumir');
    expect(s.week).toBe(s0.week + C.vanish.weeks);
    expect(s.crisis).toBeNull();
    expect(s.dilemmas).toEqual([]);
    expect(s.loans.every((l) => l.status !== 'active')).toBe(true);
    expect(s.loans[0]!.status).toBe('lost');
    expect(s.stats.writtenOff).toBe(owed);
    expect(s.fear).toBe(0);
    expect(s.word).toBe(30);
    expect(s.police.heat).toBe(0);
    expect(s.police.inquiry).toBeNull();
    expect(s.incidents).toMatchObject({
      mesada: 0,
      militia: 'none',
      militiaRate: 0,
      rivalUntil: 0,
      primoOutUntil: 0,
    });
    expect(s.requests.every((r) => r.week === s.week)).toBe(true);
    expect(s.cash).toBe(s0.cash);
    expect(s.pocket).toMatchObject({
      own: 5_000,
      blocked: 7_000,
      blockedUntil: 24,
      laranja: 3_000,
    });
    expect(s.ended).toBeNull();
  });

  it('sumir não toca no estado do rng; o bloqueio segue o prazo', () => {
    const s0 = withTrial();
    s0.pocket.blocked = 7_000;
    s0.pocket.blockedUntil = s0.week + 5;
    const s = chooseOn(s0, 'processo', 'sumir');
    expect(s.rngState).toBe(s0.rngState);
    const after = step(s).state;
    expect(after.pocket.blocked).toBe(0);
    expect(after.pocket.own).toBe(7_000);
  });

  it('sumir tira da agenda o recado e o jurado', () => {
    const s0 = withTrial();
    s0.incidents.scheduled = [
      { week: 12, id: 'jurado' },
      { week: 12, id: 'milicia_recado' },
      { week: 12, id: 'pm_paga' },
    ];
    const s = chooseOn(s0, 'processo', 'sumir');
    expect(s.incidents.scheduled.map((x) => x.id)).toEqual(['pm_paga']);
  });

  it('fugir de vez: fim exilado', () => {
    const s0 = withTrial();
    s0.pocket.offshore = 30_000;
    const s = chooseOn(s0, 'processo', 'fugir');
    expect(s.ended).toMatchObject({ kind: 'exilado', week: s0.week });
    expect(s.ended!.score).toBe(30_000 + s0.cash / 2);
    expect(s.crisis).toBeNull();
  });

  it('com o primo já entregue, a opção entregar some', () => {
    const s = raidSetup({ raids: 1 });
    s.primoGone = true;
    openTrialBy(s);
    expect(Object.keys(trial(s)!.costs)).not.toContain('entregar');
  });

  it('sem resposta, o `step` aplica a padrão', () => {
    const s = withTrial();
    const out = step(s, [], NEVER).state;
    expect(out.dilemmas.filter((d) => d.kind === 'processo')).toEqual([]);
    expect(out.crisis!.weeksLeft).toBe(C.trialWeeks - 1);
  });
});

describe('processo: julgamento', () => {
  /** Chega ao julgamento: a crise com 1 semana para acabar. */
  function atTrial(): GameState {
    const s = chooseOn(withTrial(), 'processo', 'nada');
    s.week = 16;
    s.crisis!.weeksLeft = 1;
    return s;
  }

  it('conta as semanas: abre na 10, julga ao fim da 16', () => {
    let s = chooseOn(withTrial(), 'processo', 'nada');
    s = { ...s, requests: [] };
    for (let i = 0; i < C.trialWeeks - 1; i++) {
      s = step(s, [], NEVER).state;
      expect(s.ended).toBeNull();
    }
    expect(s.crisis!.weeksLeft).toBe(1);
    expect(s.week).toBe(11 + C.trialWeeks - 1);
  });

  it('a crise aberta nesta semana não anda na mesma semana', () => {
    const s = rawTrial();
    tickCrisis(s, ALWAYS, []);
    expect(s.crisis!.weeksLeft).toBe(C.trialWeeks);
    expect(s.ended).toBeNull();
  });

  it('rng 0: preso, com o placar da Justiça', () => {
    const s = atTrial();
    s.pocket.own = 10_000;
    s.pocket.blocked = 5_000;
    s.pocket.laranja = 8_000;
    s.pocket.offshore = 20_000;
    const events: GameEvent[] = [];
    tickCrisis(s, ALWAYS, events);
    expect(s.ended).toMatchObject({ kind: 'preso', week: 16, score: 28_000 });
    expect(s.ended!.parts).toEqual([
      { part: 'laranja', amount: 8_000 },
      { part: 'offshore', amount: 20_000 },
    ]);
  });

  it('rng 0,99: absolvido, bloqueio liberado, atenção × 0,5', () => {
    const s = atTrial();
    s.pocket.own = 1_000;
    s.pocket.blocked = 5_000;
    s.police.heat = 40;
    const events: GameEvent[] = [];
    tickCrisis(s, NEVER, events);
    expect(s.ended).toBeNull();
    expect(s.crisis).toBeNull();
    expect(s.pocket.blocked).toBe(0);
    expect(s.pocket.own).toBe(6_000);
    expect(s.police.heat).toBe(20);
    expect(events.map((e) => e.type)).toEqual(['unblocked', 'crisisEnded']);
    expect(crisisLine(events[1]!)).toContain('Absolvido');
  });

  it('com advogado, a chance cai: rng 0,2 absolve com advogado e condena sem', () => {
    const s = chooseOn(withTrial(), 'processo', 'advogado');
    s.crisis!.weeksLeft = 1;
    s.week = 16;
    const lucky = structuredClone(s);
    tickCrisis(lucky, fixedRng(0.2), []);
    expect(lucky.ended).toBeNull();
    const plain = structuredClone(s);
    plain.crisis = { ...plain.crisis!, lawyer: false, prisonChance: C.prisonChance };
    tickCrisis(plain, fixedRng(0.2), []);
    expect(plain.ended?.kind).toBe('preso');
  });

  it('no `step`, o fim encerra a partida sem avançar a semana', () => {
    const s = atTrial();
    s.requests = [];
    const out = step(s, [], ALWAYS).state;
    expect(out.ended?.kind).toBe('preso');
    expect(out.week).toBe(16);
    expect(out.journal[out.journal.length - 1]!.week).toBe(16);
  });
});

describe('jurado', () => {
  it('é agendado 4 semanas depois da segunda recusa à milícia', () => {
    const { s } = base(10);
    s.incidents.militia = 'refused';
    const open = structuredClone(s);
    open.dilemmas.push({
      id: 90,
      kind: 'milicia_recado',
      week: 10,
      costs: { pagar: 0, recusar: 0 },
    });
    const after = decide(open, { type: 'choose', dilemmaId: 90, option: 'recusar' });
    expect(after.incidents.militia).toBe('refusedTwice');
    expect(after.incidents.scheduled).toContainEqual({ week: 10 + C.hit.delay, id: 'jurado' });
    const paid = decide(open, { type: 'choose', dilemmaId: 90, option: 'pagar' });
    expect(paid.incidents.scheduled.some((x) => x.id === 'jurado')).toBe(false);
  });

  it('abre a crise e o dilema; o recado agendado sem a milícia de mal é descartado', () => {
    const s = rawHit();
    expect(s.crisis).toEqual({
      kind: 'jurado',
      startWeek: 10,
      weeksLeft: C.hit.weeks,
      prisonChance: 0,
      lawyer: false,
    });
    const d = s.dilemmas.find((x) => x.kind === 'jurado')!;
    expect(d.week).toBe(11);
    expect(d.costs).toEqual({
      ficar: 0,
      pagar: Math.round((0.6 * s.cash) / 100) * 100,
      sumir: 0,
      fugir: 0,
    });
    const calm = base(10).s;
    calm.incidents.militia = 'paying';
    startJurado(calm);
    expect(calm.crisis).toBeNull();
    expect(calm.incidents.scheduled).toEqual([]);
  });

  it('com outra crise aberta, espera uma semana', () => {
    const s = withTrial();
    s.incidents.militia = 'refusedTwice';
    startJurado(s);
    expect(s.crisis!.kind).toBe('processo');
    expect(s.incidents.scheduled).toEqual([{ week: 12, id: 'jurado' }]);
  });

  it('pagar: 60% do caixa, acaba a crise, milícia em 20%', () => {
    const s0 = withHit();
    const cost = s0.dilemmas.find((x) => x.kind === 'jurado')!.costs.pagar!;
    const s = chooseOn(s0, 'jurado', 'pagar');
    expect(cost).toBe(24_000);
    expect(s.cash).toBe(s0.cash - cost);
    expect(s.stats.spent).toBe(cost);
    expect(s.crisis).toBeNull();
    expect(s.incidents).toMatchObject({ militia: 'paying', militiaRate: C.hit.militiaRate });
  });

  it('sumir e fugir valem como no processo', () => {
    const v = chooseOn(withHit(), 'jurado', 'sumir');
    expect(v.week).toBe(11 + C.vanish.weeks);
    expect(v.incidents.militia).toBe('none');
    expect(v.crisis).toBeNull();
    const f = chooseOn(withHit(), 'jurado', 'fugir');
    expect(f.ended?.kind).toBe('exilado');
  });

  it('ficar, rng 0: morto, no primeiro sorteio semanal', () => {
    const s = chooseOn(withHit(), 'jurado', 'ficar');
    s.week = 11;
    s.pocket.own = 10_000;
    s.pocket.blocked = 4_000;
    s.pocket.laranja = 6_000;
    s.pocket.offshore = 20_000;
    tickCrisis(s, ALWAYS, []);
    expect(s.ended).toMatchObject({ kind: 'morto', score: 34_000 });
    expect(s.ended!.parts.map((p) => p.part)).toEqual(['own', 'blocked', 'offshore']);
  });

  it('ficar, rng 0,99: sobrevive às 4 semanas; a milícia passa a levar 20%', () => {
    let s = chooseOn(withHit(), 'jurado', 'ficar');
    s.requests = [];
    for (let i = 0; i < C.hit.weeks; i++) {
      expect(s.crisis).not.toBeNull();
      s = step(s, [], NEVER).state;
      s.requests = [];
    }
    expect(s.ended).toBeNull();
    expect(s.crisis).toBeNull();
    expect(s.incidents).toMatchObject({ militia: 'paying', militiaRate: C.hit.militiaRate });
    const last = s.journal[s.journal.length - 1]!;
    expect(last.events.some((e) => e.type === 'crisisEnded')).toBe(true);
  });

  it('sem resposta, vale ficar', () => {
    const s = withHit();
    expect(defaultOption('jurado')).toBe('ficar');
    const out = step(s, [], NEVER).state;
    expect(out.crisis!.weeksLeft).toBe(C.hit.weeks - 1);
  });

  it('o painel dev força o jurado e o processo; uma crise por vez', () => {
    const { s } = base(10);
    const j = devForceIncident(s, 'jurado');
    expect(j.crisis?.kind).toBe('jurado');
    expect(j.devUsed).toBe(true);
    expect(() => devForceIncident(j, 'jurado')).toThrow();
    const p = devForceTrial(s);
    expect(p.crisis?.kind).toBe('processo');
    expect(trial(p)!.week).toBe(10);
    expect(() => devForceTrial(p)).toThrow();
  });
});

describe('finais', () => {
  function rich(): GameState {
    const { s } = base(25);
    s.cash = 50_000;
    s.pocket = { ...s.pocket, own: 10_000, laranja: 20_000, offshore: 30_000, blocked: 5_000 };
    return s;
  }

  it('placar de cada final', () => {
    const s = rich();
    expect(endingFor(s, 'preso')).toMatchObject({ kind: 'preso', score: 50_000 });
    expect(endingFor(s, 'morto')).toMatchObject({ kind: 'morto', score: 45_000 });
    expect(endingFor(s, 'exilado')).toMatchObject({ kind: 'exilado', score: 55_000 });
    const ap = endingFor(s, 'aposentado');
    expect(ap.score).toBe(110_000);
    expect(ap.score).toBe(s.cash + protectedWealth(s));
    for (const kind of ['preso', 'morto', 'exilado', 'aposentado'] as Ending[]) {
      const e = endingFor(s, kind);
      expect(e.parts.reduce((x, p) => x + p.amount, 0)).toBe(e.score);
      expect(endingTexts[kind].lines('Zé')).toHaveLength(2);
    }
  });

  it('aposentar: a partir da semana 20; antes, erro', () => {
    const early = rich();
    early.week = C.retireFromWeek - 1;
    expect(() => decide(early, { type: 'retire' })).toThrow();
    const ok = decide({ ...rich(), week: C.retireFromWeek }, { type: 'retire' });
    expect(ok.ended).toMatchObject({ kind: 'aposentado', score: 110_000, week: 20 });
  });

  it('com a partida encerrada, `step` e `decide` lançam erro', () => {
    const ended = decide({ ...rich(), week: 20 }, { type: 'retire' });
    expect(() => step(ended)).toThrow();
    expect(() => decide(ended, { type: 'stash', to: 'own', amount: 1 })).toThrow();
    expect(() => decide(ended, { type: 'retire' })).toThrow();
    expect(() => applyChoice(ended, 1, 'x')).toThrow();
  });

  it('o save guarda o fim e volta igual', () => {
    const ended = decide({ ...rich(), week: 20 }, { type: 'retire' });
    expect(deserialize(serialize(ended))).toEqual(ended);
  });

  it('o bot para de avançar com a partida encerrada', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const s = playBot(newGame(seed), 40, { monthlyRate: 20, weeks: 8, incidents: 'recusa' });
      if (s.ended) expect(s.week).toBe(s.ended.week);
    }
  });
});

describe('primo entregue', () => {
  it('levelFor com primoOut vira pressão; primoGone entra no mesmo caminho', () => {
    const { s, loan } = base(10);
    s.policy.collection = { conversa: null, pressao: null, primo: 1 };
    loan.missedStreak = 2;
    expect(levelFor(s.policy, loan, false)).toBe('primo');
    expect(levelFor(s.policy, loan, true)).toBe('pressao');
    s.primoGone = true;
    const out = step(s, [], NEVER).state;
    expect(out.loans[0]!.lastLevel).toBe('pressao');
    loan.override = 'primo';
    expect(levelFor(s.policy, loan, true)).toBe('pressao');
  });

  it('o rival deixa de oferecer o primo', () => {
    const { s } = base(10);
    s.primoGone = true;
    const open = devForceIncident(s, 'rival');
    expect(Object.keys(open.dilemmas.find((d) => d.kind === 'rival')!.costs)).toEqual(['ignorar']);
  });
});

describe('textos', () => {
  it('todo dilema de crise tem cartão com todas as opções, e linhas do Jornal', () => {
    for (const kind of ['processo', 'jurado'] as const) {
      const t = crisisDilemmaTexts[kind]!;
      expect(Object.keys(t.options)).toEqual([...dilemmaOptions[kind]!]);
      expect(t.title({})).toBeTruthy();
      for (const o of Object.values(t.options)) expect(o.label({ amount: 100 })).toBeTruthy();
    }
    const s = withTrial();
    const lines = reportLines({
      week: 10,
      events: [{ type: 'crisisOpened', kind: 'processo' }],
      cash: 0,
      fear: 0,
      word: 0,
      heat: 0,
    });
    expect(lines.join(' ')).toContain('Ministério Público');
    expect(s.crisis).not.toBeNull();
  });

  it('o jornal conta o que o jogador escolheu', () => {
    const s0 = withTrial();
    const cost = trial(s0)!.costs.acordo!;
    const s = chooseOn(s0, 'processo', 'acordo');
    const ev = s.queue.map((q) => q.event);
    const lines = reportLines({ week: 10, events: ev, cash: s.cash, fear: 0, word: 0, heat: 0 });
    expect(lines.some((l) => l.includes('gaveta') && l.includes('R$'))).toBe(true);
    expect(cost).toBeGreaterThan(0);
  });
});

describe('partidas inteiras', () => {
  it('com crise, o caixa continua fechando e o mesmo jogo dá a mesma partida', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const o = {
        monthlyRate: 25,
        weeks: 8,
        policy: { conversa: null, pressao: null, primo: 1 },
      } as const;
      const s = playBot(newGame(seed), 40, { ...o, crisis: 'acordo' });
      const { lent, received, recovered, seized, spent, returned } = s.stats;
      const p = s.pocket;
      expect(
        s.cash + p.own + p.laranja + p.offshore + p.blocked + s.stats.betrayed + s.stats.fees,
      ).toBe(20_000 - lent + received + recovered - seized - spent + returned);
      expect(s.cash).toBeGreaterThanOrEqual(0);
    }
    const a = playBot(newGame(5), 40, { monthlyRate: 25, weeks: 8, crisis: 'sumir' });
    const b = playBot(newGame(5), 40, { monthlyRate: 25, weeks: 8, crisis: 'sumir' });
    expect(a).toEqual(b);
  });
});

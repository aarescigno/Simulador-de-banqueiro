import { describe, expect, it } from 'vitest';
import { collection, params } from '../src/content/params';
import {
  collect,
  forgive,
  generateRequests,
  hazard,
  levelFor,
  makeLoan,
  payChance,
} from '../src/engine/agiota';
import { decide, newGame, step } from '../src/engine/game';
import type { Rng } from '../src/engine/rng';
import type {
  Collateral,
  GameEvent,
  GameState,
  Level,
  CollectionPolicy,
} from '../src/engine/state';

function fixedRng(x: number): Rng {
  return {
    next: () => x,
    int: (min) => min,
    chance: (p) => x < p,
    pick: (items) => items[0]!,
    state: () => 0,
  };
}

function withLoan(streak: number, collateral: Collateral | null = null): GameState {
  const s = newGame(1);
  const req = {
    ...s.requests[0]!,
    risk: 0.3,
    amount: 1_000,
    assets: collateral ? [collateral] : [],
  };
  const loan = makeLoan(s, req, { monthlyRate: 20, weeks: 8, collateral: collateral?.kind });
  loan.missedStreak = streak;
  return { ...s, requests: [], loans: [loan], week: s.week + 1 };
}

/** RNG que devolve os valores em ordem e repete o último. */
function seqRng(...values: number[]): Rng {
  let i = 0;
  const next = () => values[Math.min(i++, values.length - 1)]!;
  return { ...fixedRng(0), next, chance: (p) => next() < p };
}

const policy = (c: Partial<CollectionPolicy>) => ({
  collection: { conversa: 1, pressao: 2, primo: 4, ...c },
});

describe('levelFor', () => {
  const loan = (missedStreak: number, override: Level | null = null) => ({
    missedStreak,
    override,
  });
  const p = policy({});

  it('sem atraso, nenhum nível', () => {
    expect(levelFor(p, loan(0))).toBeNull();
    expect(levelFor(p, loan(0, 'primo'))).toBeNull();
  });
  it('vale o nível mais alto cujo limiar já chegou', () => {
    expect(levelFor(p, loan(1))).toBe('conversa');
    expect(levelFor(p, loan(2))).toBe('pressao');
    expect(levelFor(p, loan(3))).toBe('pressao');
    expect(levelFor(p, loan(4))).toBe('primo');
  });
  it('"nunca" não vale; tudo nunca = sem cobrança', () => {
    expect(levelFor(policy({ primo: null }), loan(5))).toBe('pressao');
    expect(levelFor(policy({ conversa: null, pressao: null, primo: null }), loan(5))).toBeNull();
  });
  it('a exceção vence a regra, mesmo "nunca"', () => {
    expect(levelFor(p, loan(1, 'primo'))).toBe('primo');
    expect(
      levelFor(policy({ conversa: null, pressao: null, primo: null }), loan(2, 'conversa')),
    ).toBe('conversa');
  });
});

describe('chance de pagar e de quebrar', () => {
  const base = { risk: 0.95, monthlyRate: 20, broke: false };
  it('cresce com o nível e com o medo', () => {
    const a = payChance(base);
    const c = payChance(base, { level: 'conversa' });
    const pr = payChance(base, { level: 'pressao' });
    const pi = payChance(base, { level: 'primo' });
    expect(c).toBeCloseTo(a + 0.08);
    expect(pr).toBeCloseTo(a + 0.16);
    expect(pi).toBeCloseTo(a + collection.levels.primo.payBonus);
    expect(payChance(base, { fear: 100 })).toBeCloseTo(a + 0.12);
  });
  it('quem quebrou paga mais só com pressão ou primo', () => {
    const b = { ...base, broke: true };
    expect(payChance(b, { level: 'conversa' })).toBe(params.payment.brokePay);
    expect(payChance(b, { level: 'pressao' })).toBeCloseTo(params.payment.brokePay + 0.05);
    expect(payChance(b, { level: 'primo' })).toBeCloseTo(
      params.payment.brokePay + collection.levels.primo.brokePay,
    );
    expect(payChance(b, { fear: 100 })).toBe(params.payment.brokePay);
  });
  it('pressão e primo aumentam a chance de quebrar', () => {
    expect(hazard(base, 'conversa')).toBe(hazard(base));
    expect(hazard(base, 'pressao')).toBeCloseTo(hazard(base) + 0.02);
    expect(hazard(base, 'primo')).toBeCloseTo(hazard(base) + 0.03);
  });
});

describe('efeito de cada nível', () => {
  const run = (level: Level, x: number) => {
    const s = withLoan(1);
    s.policy = policy({ conversa: null, pressao: null, primo: null });
    s.loans[0]!.override = level;
    const events: GameEvent[] = [];
    collect(s, s.loans[0]!, fixedRng(x), events);
    return { s, events };
  };

  it.each([
    ['conversa', collection.levels.conversa.fear, 0],
    ['pressao', collection.levels.pressao.fear, collection.levels.pressao.word],
    ['primo', collection.levels.primo.fear, collection.levels.primo.word],
  ] as const)('%s mexe no medo e no boca a boca, paga ou não', (level, fear, word) => {
    for (const x of [1, 0.0001]) {
      const { s } = run(level, x);
      expect(s.fear).toBeCloseTo(fear);
      expect(s.word).toBeCloseTo(30 + word);
    }
  });

  it('denúncia: pressão 2%, primo 6%, conversa nunca', () => {
    expect(run('pressao', 0.01).s.complaints).toBe(1);
    expect(run('pressao', 0.03).s.complaints).toBe(0);
    expect(run('primo', 0.05).s.complaints).toBe(1);
    expect(run('primo', 0.07).s.complaints).toBe(0);
    expect(run('conversa', 0.0001).s.complaints).toBe(0);
    expect(run('primo', 0.0001).events.some((e) => e.type === 'complaint')).toBe(true);
  });

  it('o evento de pagamento e o de atraso levam o nível', () => {
    expect(run('primo', 0.0001).events.find((e) => e.type === 'paid')).toMatchObject({
      level: 'primo',
    });
    expect(run('primo', 1).events.find((e) => e.type === 'missed')).toMatchObject({
      level: 'primo',
    });
  });

  it('sem atraso, nada acontece com medo e boca a boca', () => {
    const s = withLoan(0);
    collect(s, s.loans[0]!, fixedRng(1), []);
    expect(s.fear).toBe(0);
    expect(s.word).toBe(30);
  });
});

describe('custo das garantias', () => {
  const defaultIt = (c: Collateral, x: number) => {
    const s = withLoan(params.payment.defaultAfterWeeks - 1, c);
    s.policy = policy({ conversa: null, pressao: null, primo: null });
    // hazard: não quebra; pagamento: não paga; depois, a denúncia.
    collect(s, s.loans[0]!, seqRng(1, 1, x), []);
    return s;
  };

  it('celular tomado: custa medo e boca a boca e pode virar denúncia', () => {
    const s = defaultIt({ kind: 'celular', value: 500 }, 0.05);
    expect(s.loans[0]!.status).toBe('defaulted');
    expect(s.fear).toBe(collection.seized.celular.fear);
    expect(s.word).toBe(30 + collection.seized.celular.word);
    expect(s.complaints).toBe(1);
    expect(defaultIt({ kind: 'celular', value: 500 }, 1).complaints).toBe(0);
  });
  it('moto tomada: custa mais que o celular', () => {
    const s = defaultIt({ kind: 'moto', value: 5_000 }, 0.2);
    expect(s.fear).toBe(collection.seized.moto.fear);
    expect(s.word).toBe(30 + collection.seized.moto.word);
    expect(s.complaints).toBe(1);
    expect(defaultIt({ kind: 'moto', value: 5_000 }, 0.4).complaints).toBe(0);
  });
  it('cartão do INSS: custa boca a boca ao fechar e tem denúncia semanal', () => {
    const s = newGame(2);
    const req = {
      ...s.requests[0]!,
      assets: [{ kind: 'inss', value: 2_000 } as const],
      maxRate: 100,
    };
    const lent = decide(
      { ...s, requests: [req] },
      {
        type: 'accept',
        requestId: req.id,
        monthlyRate: 20,
        weeks: 8,
        collateral: 'inss',
      },
    );
    expect(lent.word).toBe(30 + collection.word.loanMade + collection.inss.wordOnLend);
    const t = withLoan(0, { kind: 'inss', value: 2_000 });
    collect(t, t.loans[0]!, fixedRng(collection.inss.complaintPerWeek - 0.001), []);
    expect(t.complaints).toBe(1);
    const u = withLoan(0, { kind: 'inss', value: 2_000 });
    collect(u, u.loans[0]!, fixedRng(collection.inss.complaintPerWeek + 0.001), []);
    expect(u.complaints).toBe(0);
  });
});

describe('perdão, política e exceção', () => {
  it('perdoar encerra, soma no perdoado, boca +4, medo −2, caixa igual', () => {
    const s = { ...withLoan(2), fear: 10 };
    const cash = s.cash;
    const owed = s.loans[0]!.totalDue;
    const after = decide(s, { type: 'forgive', loanId: s.loans[0]!.id });
    expect(after.loans[0]!.status).toBe('forgiven');
    expect(after.stats.forgiven).toBe(owed);
    expect(after.word).toBe(34);
    expect(after.fear).toBe(8);
    expect(after.cash).toBe(cash);
    expect(after.queue.at(-1)?.event).toMatchObject({ type: 'forgiven', amount: owed });
    expect(() => decide(after, { type: 'forgive', loanId: s.loans[0]!.id })).toThrow();
    expect(() => forgive(structuredClone(s), 999, [])).toThrow();
  });

  it('medo não passa de 0 a 100', () => {
    const s = withLoan(2);
    expect(decide(s, { type: 'forgive', loanId: s.loans[0]!.id }).fear).toBe(0);
  });

  it('política e exceção valem; limiar inválido lança erro', () => {
    const s = withLoan(1);
    const p = decide(s, {
      type: 'setPolicy',
      collection: { conversa: 3, pressao: null, primo: 5 },
    });
    expect(p.policy.collection).toEqual({ conversa: 3, pressao: null, primo: 5 });
    expect(() =>
      decide(s, { type: 'setPolicy', collection: { conversa: 6, pressao: 1, primo: 1 } }),
    ).toThrow();
    const o = decide(s, { type: 'setOverride', loanId: s.loans[0]!.id, override: 'primo' });
    expect(o.loans[0]!.override).toBe('primo');
  });
});

describe('medo e boca a boca no tempo', () => {
  it('medo decai 15% e boca a boca anda 5% em direção a 30', () => {
    const s = { ...newGame(3), requests: [], fear: 40, word: 70 };
    const { state } = step(s, [], fixedRng(1));
    expect(state.fear).toBeCloseTo(34);
    expect(state.word).toBeCloseTo(70 - 2);
    const low = step({ ...s, fear: 0, word: 10 }, [], fixedRng(1)).state;
    expect(low.word).toBeCloseTo(11);
    expect(state.journal.at(-1)).toMatchObject({ fear: state.fear, word: state.word });
  });

  it('denúncia ambiente sai com medo alto', () => {
    const s = { ...newGame(3), requests: [], fear: 100 };
    const { state, events } = step(s, [], fixedRng(0.01));
    expect(state.complaints).toBe(1);
    expect(events).toContainEqual({ type: 'complaint', source: 'ambiente' });
  });

  const avgRequests = (patch: Partial<GameState>) => {
    let total = 0;
    for (let seed = 1; seed <= 200; seed++) {
      total += generateRequests({ ...newGame(seed), ...patch }, createRngFor(seed)).length;
    }
    return total / 200;
  };
  const avgRisk = (patch: Partial<GameState>) => {
    let total = 0;
    let n = 0;
    for (let seed = 1; seed <= 200; seed++) {
      for (const r of generateRequests({ ...newGame(seed), ...patch }, createRngFor(seed + 1000))) {
        total += r.risk;
        n++;
      }
    }
    return total / n;
  };

  it('em 30 dá cerca de 2,25 pedidos; mais boca a boca dá mais', () => {
    expect(avgRequests({ word: 30 })).toBeGreaterThan(2);
    expect(avgRequests({ word: 30 })).toBeLessThan(2.5);
    expect(avgRequests({ word: 80 })).toBeGreaterThan(avgRequests({ word: 30 }) + 0.5);
    expect(avgRequests({ word: 100 })).toBeLessThanOrEqual(5);
  });
  it('mais medo, mais risco em quem pede', () => {
    expect(avgRisk({ fear: 100 })).toBeGreaterThan(avgRisk({ fear: 0 }));
  });
});

import { createRng } from '../src/engine/rng';
const createRngFor = (seed: number) => createRng(seed);

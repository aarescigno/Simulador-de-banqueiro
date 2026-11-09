import { describe, expect, it } from 'vitest';
import { police } from '../src/content/params';
import { generateRequests, makeLoan } from '../src/engine/agiota';
import { decide, newGame, step } from '../src/engine/game';
import { bribeCost, complain, heatBand, raidChance, tickPolice } from '../src/engine/police';
import { createRng, type Rng } from '../src/engine/rng';
import type { Collateral, GameEvent, GameState } from '../src/engine/state';

function fixedRng(x: number): Rng {
  return {
    next: () => x,
    int: (min) => min,
    chance: (p) => x < p,
    pick: (items) => items[0]!,
    state: () => 0,
  };
}

/** Partida sem pedidos, com a atenção e o inquérito dados. */
function base(heat: number, extra: Partial<GameState> = {}): GameState {
  const s = newGame(1);
  return { ...s, requests: [], ...extra, police: { ...s.police, heat, ...extra.police } };
}

function withInquiry(
  weeksLeft: number,
  opts: { heat?: number; lawyer?: boolean; complaints?: number } = {},
): GameState {
  const s = base(opts.heat ?? 0);
  s.police.inquiry = {
    startWeek: 1,
    weeksLeft,
    lawyer: opts.lawyer ?? false,
    complaints: opts.complaints ?? 0,
  };
  return s;
}

const types = (events: GameEvent[]) => events.map((e) => e.type);

describe('faixas', () => {
  it('respeita os limites', () => {
    const { medium, high } = police.bands;
    expect(heatBand(medium - 0.1)).toBe('baixa');
    expect(heatBand(medium)).toBe('media');
    expect(heatBand(high - 0.1)).toBe('media');
    expect(heatBand(high)).toBe('alta');
  });
});

describe('denúncia', () => {
  it('soma o peso da origem', () => {
    const s = base(0);
    const events: GameEvent[] = [];
    complain(s, fixedRng(0), events, 1, 'primo');
    expect(s.police.heat).toBe(police.complaint.primo);
    expect(s.complaints).toBe(1);
    complain(s, fixedRng(0), events, 1, 'celular');
    expect(s.police.heat).toBe(police.complaint.primo + police.complaint.celular);
  });

  it('não soma sem sorteio e limita em 100', () => {
    const s = base(95);
    complain(s, fixedRng(0.99), [], 0.5, 'primo');
    expect(s.police.heat).toBe(95);
    complain(s, fixedRng(0), [], 1, 'primo');
    expect(s.police.heat).toBe(100);
  });

  it('conta no inquérito aberto', () => {
    const s = withInquiry(3);
    complain(s, fixedRng(0), [], 1, 'moto');
    expect(s.police.inquiry!.complaints).toBe(1);
    const sem = base(0);
    complain(sem, fixedRng(0), [], 1, 'moto');
    expect(sem.police.inquiry).toBeNull();
  });
});

describe('atenção por semana', () => {
  it('decai e ganha com o boca a boca acima do piso', () => {
    const s = base(50, { word: 80 });
    tickPolice(s, fixedRng(0.99), [], 'media');
    expect(s.police.heat).toBeCloseTo(50 * police.decay + 30 * police.wordWeight, 6);
    const t = base(50, { word: 40 });
    tickPolice(t, fixedRng(0.99), [], 'media');
    expect(t.police.heat).toBeCloseTo(50 * police.decay, 6);
  });

  it('avisa quando a faixa sobe, não quando desce', () => {
    const s = base(25 / police.decay + 0.1);
    const up: GameEvent[] = [];
    tickPolice(s, fixedRng(0.99), up, 'baixa');
    expect(up).toContainEqual({ type: 'heatRose', band: 'media' });
    const down: GameEvent[] = [];
    tickPolice(base(10), fixedRng(0.99), down, 'media');
    expect(types(down)).not.toContain('heatRose');
  });
});

describe('abertura do inquérito', () => {
  it('faixa baixa nunca abre', () => {
    const s = base(10);
    const ev: GameEvent[] = [];
    tickPolice(s, fixedRng(0), ev, 'baixa');
    expect(s.police.inquiry).toBeNull();
    expect(s.dilemmas).toHaveLength(0);
  });

  it('média com rng 0 abre inquérito e dilema com o preço congelado', () => {
    const s = base(30, { cash: 20_000 });
    const ev: GameEvent[] = [];
    tickPolice(s, fixedRng(0), ev, 'media');
    expect(s.police.inquiry).toEqual({
      startWeek: 1,
      weeksLeft: police.inquiry.weeks,
      lawyer: false,
      complaints: 0,
    });
    expect(types(ev)).toContain('inquiryOpened');
    expect(s.dilemmas).toHaveLength(1);
    const d = s.dilemmas[0]!;
    expect(d.kind).toBe('inquerito');
    expect(d.costs).toEqual({ pagar: 4_000, advogado: police.lawyer, correr: 0 });
  });

  it('um por vez e respeita o cooldown', () => {
    const open = withInquiry(3, { heat: 60 });
    tickPolice(open, fixedRng(0), [], 'alta');
    expect(open.dilemmas).toHaveLength(0);
    expect(open.police.inquiry!.weeksLeft).toBe(2);

    const cool = base(60);
    cool.police.cooldownUntil = cool.week + 1;
    tickPolice(cool, fixedRng(0), [], 'alta');
    expect(cool.police.inquiry).toBeNull();
    cool.police.cooldownUntil = cool.week;
    tickPolice(cool, fixedRng(0), [], 'alta');
    expect(cool.police.inquiry).not.toBeNull();
  });
});

describe('dilema', () => {
  function opened(cash = 20_000): GameState {
    const s = base(30, { cash });
    tickPolice(s, fixedRng(0), [], 'media');
    return s;
  }

  it('pagar desconta, fecha, conta a propina e encarece a próxima', () => {
    const s = opened();
    const d = s.dilemmas[0]!;
    const after = decide(s, { type: 'choose', dilemmaId: d.id, option: 'pagar' });
    expect(after.cash).toBe(20_000 - d.costs.pagar);
    expect(after.police.inquiry).toBeNull();
    expect(after.police.bribes).toBe(1);
    expect(after.police.cooldownUntil).toBe(after.week + police.cooldown);
    expect(after.police.heat).toBe(s.police.heat);
    expect(after.dilemmas).toHaveLength(0);
    expect(after.queue.some((q) => q.event.type === 'bribed')).toBe(true);
    expect(bribeCost(20_000, 1)).toBe(bribeCost(20_000, 0) * 1.5);
  });

  it('pagar sem caixa lança erro', () => {
    const s = opened(20_000);
    s.cash = 1_000;
    expect(() =>
      decide(s, { type: 'choose', dilemmaId: s.dilemmas[0]!.id, option: 'pagar' }),
    ).toThrow();
  });

  it('opção ou dilema inválido lança erro', () => {
    const s = opened();
    expect(() => decide(s, { type: 'choose', dilemmaId: 999, option: 'correr' })).toThrow();
    expect(() =>
      decide(s, { type: 'choose', dilemmaId: s.dilemmas[0]!.id, option: 'x' as never }),
    ).toThrow();
  });

  it('advogado desconta e marca', () => {
    const s = opened();
    const after = decide(s, { type: 'choose', dilemmaId: s.dilemmas[0]!.id, option: 'advogado' });
    expect(after.cash).toBe(20_000 - police.lawyer);
    expect(after.police.inquiry!.lawyer).toBe(true);
    expect(after.queue.some((q) => q.event.type === 'lawyerHired')).toBe(true);
  });

  it('sem resposta vira correr', () => {
    const s = opened();
    const { state } = step({ ...s, requests: [] }, [], fixedRng(0.99));
    expect(state.dilemmas).toHaveLength(0);
    expect(state.cash).toBe(s.cash);
    expect(state.police.inquiry).not.toBeNull();
    expect(state.police.inquiry!.lawyer).toBe(false);
  });
});

function withLoans(s: GameState, collaterals: (Collateral | null)[]): GameState {
  const req = newGame(1).requests[0]!;
  s.loans = collaterals.map((c, i) => {
    const loan = makeLoan(
      s,
      { ...req, id: 100 + i, amount: 1_000, assets: c ? [c] : [] },
      { monthlyRate: 20, weeks: 8, collateral: c?.kind },
    );
    loan.startWeek = 0;
    return loan;
  });
  return s;
}

describe('resolução', () => {
  it('só resolve depois de 4 semanas', () => {
    const s = base(30);
    s.police.inquiry = { startWeek: 1, weeksLeft: 4, lawyer: false, complaints: 0 };
    for (let i = 0; i < 3; i++) {
      const ev: GameEvent[] = [];
      tickPolice(s, fixedRng(0), ev, 'media');
      expect(types(ev)).not.toContain('raid');
      expect(s.police.inquiry).not.toBeNull();
    }
    const ev: GameEvent[] = [];
    tickPolice(s, fixedRng(0), ev, 'media');
    expect(types(ev)).toContain('raid');
    expect(s.police.inquiry).toBeNull();
  });

  it('busca com rng 0: leva caixa, INSS sempre, outros pelo sorteio, medo e atenção', () => {
    const inss: Collateral = { kind: 'inss', value: 2_000 };
    const s = withLoans(withInquiry(1, { heat: 40 }), [inss, null, null]);
    s.cash = 10_001;
    s.fear = 60;
    const ev: GameEvent[] = [];
    tickPolice(s, fixedRng(0), ev, 'media');
    const seized = Math.round(10_001 * police.raid.cashShare);
    expect(s.cash).toBe(10_001 - seized);
    expect(s.stats.seized).toBe(seized);
    expect(s.loans.map((l) => l.status)).toEqual(['lost', 'lost', 'lost']);
    expect(s.stats.writtenOff).toBe(s.loans.reduce((a, l) => a + l.totalDue, 0));
    expect(s.fear).toBeCloseTo(30, 6);
    expect(s.police.heat).toBeCloseTo(40 * police.decay * police.raid.heatAfter, 6);
    expect(s.police.raids).toBe(1);
    expect(s.police.cooldownUntil).toBe(s.week + police.cooldown);
    const raid = ev.find((e) => e.type === 'raid');
    expect(raid).toMatchObject({ type: 'raid', seized });
  });

  it('busca com rng 0.5: só o INSS (cartão é prova) se perde', () => {
    const inss: Collateral = { kind: 'inss', value: 2_000 };
    const s = withLoans(withInquiry(1, { heat: 80 }), [inss, null]);
    tickPolice(s, fixedRng(0.5), [], 'alta');
    // 0,5 < chance de busca (heat 73,6 → 0,79): busca; 0,5 ≥ 0,35: o outro fica.
    expect(s.loans.map((l) => l.status)).toEqual(['lost', 'active']);
  });

  it('com rng 0.99: arquivado, atenção × 0,7', () => {
    const s = withInquiry(1, { heat: 40 });
    const ev: GameEvent[] = [];
    tickPolice(s, fixedRng(0.99), ev, 'media');
    expect(types(ev)).toContain('inquiryArchived');
    expect(s.police.heat).toBeCloseTo(40 * police.decay * police.archived.heatAfter, 6);
    expect(s.police.inquiry).toBeNull();
    expect(s.police.cooldownUntil).toBe(s.week + police.cooldown);
  });

  it('advogado reduz a chance de busca; denúncias aumentam', () => {
    const sem = raidChance(60, 2, false);
    const com = raidChance(60, 2, true);
    expect(com).toBeLessThan(sem);
    expect(raidChance(60, 4, false)).toBeGreaterThan(sem);
    expect(raidChance(0, 0, false)).toBe(police.inquiry.raidMin);
    expect(raidChance(100, 10, false)).toBe(police.inquiry.raidMax);
  });
});

describe('pedidos com inquérito', () => {
  it('chega 1 a menos por semana, em média', () => {
    let sem = 0;
    let com = 0;
    for (let seed = 1; seed <= 200; seed++) {
      const s = newGame(seed);
      sem += generateRequests({ ...s, requests: [] }, createRng(seed)).length;
      const aberto = withInquiry(3);
      com += generateRequests({ ...aberto, word: s.word }, createRng(seed)).length;
    }
    expect((sem - com) / 200).toBeGreaterThan(0.8);
    expect(com).toBeGreaterThanOrEqual(0);
  });
});

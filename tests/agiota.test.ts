import { describe, expect, it } from 'vitest';
import { params } from '../src/content/params';
import { collect, hazard, makeLoan, payChance, quote, tolerance } from '../src/engine/agiota';
import { decide, newGame, step } from '../src/engine/game';
import type { Rng } from '../src/engine/rng';
import type { Collateral, GameEvent, GameState, LoanRequest } from '../src/engine/state';
import { playBot } from '../sim/bot';

/** RNG de teste que sempre devolve o mesmo número. */
function fixedRng(x: number): Rng {
  return {
    next: () => x,
    int: (min) => min,
    chance: (p) => x < p,
    pick: (items) => items[0]!,
    state: () => 0,
  };
}

function withLoan(
  risk: number,
  monthlyRate = 20,
  weeks = 4,
  collateral: Collateral | null = null,
): GameState {
  const s = newGame(1);
  const req = { ...s.requests[0]!, risk, amount: 1_000, assets: collateral ? [collateral] : [] };
  const terms = { monthlyRate, weeks, collateral: collateral?.kind };
  return { ...s, requests: [], loans: [makeLoan(s, req, terms)] };
}

/** Partida com um único pedido controlado. */
function withRequest(patch: Partial<LoanRequest>): GameState {
  const s = newGame(1);
  const req: LoanRequest = {
    ...s.requests[0]!,
    amount: 1_000,
    maxRate: 30,
    patience: 1,
    assets: [
      { kind: 'celular', value: 1_000 },
      { kind: 'moto', value: 5_000 },
    ],
    ...patch,
  };
  return { ...s, requests: [req] };
}

describe('pedidos', () => {
  it('chegam de 1 a 3 por semana, com ficha completa', () => {
    let s = newGame(5);
    for (let i = 0; i < 30; i++) {
      expect(s.requests.length).toBeGreaterThanOrEqual(params.requests.perWeek[0]);
      expect(s.requests.length).toBeLessThanOrEqual(params.requests.perWeek[1]);
      for (const r of s.requests) {
        expect(r.debtor.short).toBeTruthy();
        expect(r.debtor.profession).toBeTruthy();
        expect(r.reason).toBeTruthy();
        expect(r.amount).toBeGreaterThan(0);
        expect(r.risk).toBeGreaterThanOrEqual(0);
        expect(r.risk).toBeLessThanOrEqual(1);
      }
      s = step(s).state;
    }
  });

  it('aceitar tira do caixa e cria o empréstimo', () => {
    const s = newGame(5);
    const req = s.requests[0]!;
    const after = decide(s, { type: 'accept', requestId: req.id, monthlyRate: 20, weeks: 8 });
    expect(after.cash).toBe(s.cash - req.amount);
    expect(after.loans).toHaveLength(1);
    expect(after.requests.find((r) => r.id === req.id)).toBeUndefined();
    expect(after.queue.at(-1)?.event.type).toBe('loanMade');
  });

  it('recusar só tira o pedido', () => {
    const s = newGame(5);
    const req = s.requests[0]!;
    const after = decide(s, { type: 'refuse', requestId: req.id });
    expect(after.cash).toBe(s.cash);
    expect(after.loans).toHaveLength(0);
    expect(after.requests).toHaveLength(s.requests.length - 1);
  });

  it('não empresta o que não tem nem fora dos limites', () => {
    const s = { ...newGame(5), cash: 0 };
    const id = s.requests[0]!.id;
    expect(() => decide(s, { type: 'accept', requestId: id, monthlyRate: 20, weeks: 8 })).toThrow();
    const rich = newGame(5);
    expect(() =>
      decide(rich, { type: 'accept', requestId: id, monthlyRate: 500, weeks: 8 }),
    ).toThrow();
  });

  it('pedido sem resposta expira na virada da semana', () => {
    const s = newGame(5);
    const { events } = step(s);
    expect(events.filter((e) => e.type === 'expired')).toHaveLength(s.requests.length);
  });
});

describe('negociação', () => {
  it('dentro do que o devedor topa, fecha na hora', () => {
    const s = withRequest({});
    const after = decide(s, {
      type: 'accept',
      requestId: s.requests[0]!.id,
      monthlyRate: 30,
      weeks: 8,
    });
    expect(after.loans).toHaveLength(1);
    expect(after.requests).toHaveLength(0);
  });

  it('acima, vira contraproposta; sem paciência, vai embora', () => {
    const s = withRequest({ patience: 1 });
    const id = s.requests[0]!.id;
    const offer = { type: 'accept', requestId: id, monthlyRate: 50, weeks: 8 } as const;
    const countered = decide(s, offer);
    expect(countered.loans).toHaveLength(0);
    expect(countered.cash).toBe(s.cash);
    expect(countered.requests[0]!.counter).toEqual({ rate: 30, collateral: null });
    expect(s.requests[0]!.counter).toBeUndefined();

    const gone = decide(countered, offer);
    expect(gone.requests).toHaveLength(0);
    expect(gone.loans).toHaveLength(0);
    expect(gone.queue.at(-1)?.event.type).toBe('walkedOut');
  });

  it('a contraproposta fecha', () => {
    const s = withRequest({ patience: 1 });
    const id = s.requests[0]!.id;
    const countered = decide(s, { type: 'accept', requestId: id, monthlyRate: 50, weeks: 8 });
    const rate = countered.requests[0]!.counter!.rate;
    const after = decide(countered, { type: 'accept', requestId: id, monthlyRate: rate, weeks: 8 });
    expect(after.loans[0]!.monthlyRate).toBe(rate);
  });

  it('exigir garantia baixa a taxa que o devedor topa', () => {
    const req = withRequest({}).requests[0]!;
    expect(tolerance(req, 'celular')).toBeLessThan(tolerance(req));
    expect(tolerance(req, 'moto')).toBeLessThan(tolerance(req, 'celular'));
    expect(tolerance(req, 'inss')).toBeLessThan(tolerance(req, 'moto'));
    expect(tolerance({ ...req, maxRate: 2 }, 'inss')).toBe(params.terms.rate.min);
  });

  it('não aceita garantia que o devedor não tem', () => {
    const s = withRequest({ assets: [{ kind: 'celular', value: 900 }] });
    const id = s.requests[0]!.id;
    expect(() =>
      decide(s, { type: 'accept', requestId: id, monthlyRate: 10, weeks: 8, collateral: 'moto' }),
    ).toThrow();
  });

  it('quem tem mais risco topa juro mais alto (média)', () => {
    const low: number[] = [];
    const high: number[] = [];
    let s = newGame(11);
    for (let i = 0; i < 200; i++) {
      for (const r of s.requests) (r.risk < 0.3 ? low : r.risk > 0.6 ? high : []).push(r.maxRate);
      s = step(s).state;
    }
    const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    expect(avg(high)).toBeGreaterThan(avg(low));
  });
});

describe('garantias', () => {
  it('todo pedido oferece ao menos o celular; cartão do INSS só para aposentado', () => {
    let s = newGame(8);
    for (let i = 0; i < 60; i++) {
      for (const r of s.requests) {
        expect(r.assets.some((a) => a.kind === 'celular')).toBe(true);
        if (r.assets.some((a) => a.kind === 'inss'))
          expect(r.debtor.profession).toMatch(/aposentad/);
        expect(r.patience).toBeGreaterThanOrEqual(params.negotiation.patience[0]);
      }
      s = step(s).state;
    }
  });

  it('garantia aumenta a chance de pagar; cartão do INSS paga mesmo depois de quebrar', () => {
    const base = { risk: 0.4, monthlyRate: 20, broke: false };
    const moto = { kind: 'moto', value: 5_000 } as const;
    const inss = { kind: 'inss', value: 2_000 } as const;
    expect(payChance({ ...base, collateral: moto })).toBeGreaterThan(payChance(base));
    expect(payChance({ ...base, broke: true, collateral: inss })).toBeGreaterThan(
      payChance({ ...base, broke: true }),
    );
  });

  it('no calote, a garantia é vendida e abate a perda', () => {
    const s = withLoan(0.5, 20, 4, { kind: 'moto', value: 800 });
    const loan = s.loans[0]!;
    const events: GameEvent[] = [];
    const state = { ...s, stats: { ...s.stats } };
    for (let w = 1; w <= params.payment.defaultAfterWeeks; w++) {
      collect({ ...state, week: s.week + w }, loan, fixedRng(0.999), events);
    }
    const recovered = Math.round(800 * params.collateral.moto.recovery);
    expect(loan.status).toBe('defaulted');
    expect(loan.recovered).toBe(recovered);
    expect(events.at(-1)).toMatchObject({
      type: 'defaulted',
      recovered,
      writtenOff: loan.totalDue - recovered,
      collateral: 'moto',
    });
  });

  it('a venda da garantia nunca passa do que falta pagar', () => {
    const s = withLoan(0.5, 20, 4, { kind: 'moto', value: 100_000 });
    const loan = s.loans[0]!;
    const events: GameEvent[] = [];
    for (let w = 1; w <= params.payment.defaultAfterWeeks; w++) {
      collect({ ...s, week: s.week + w }, loan, fixedRng(0.999), events);
    }
    expect(loan.recovered).toBe(loan.totalDue);
    expect(events.at(-1)).toMatchObject({ writtenOff: 0 });
  });

  it('cartão do INSS bloqueado no calote não rende nada', () => {
    const s = withLoan(0.5, 20, 4, { kind: 'inss', value: 2_000 });
    const loan = s.loans[0]!;
    for (let w = 1; w <= params.payment.defaultAfterWeeks; w++) {
      collect({ ...s, week: s.week + w }, loan, fixedRng(0.999), []);
    }
    expect(loan.status).toBe('defaulted');
    expect(loan.recovered).toBe(0);
  });
});

describe('parcelas', () => {
  it('juro simples ao mês, parcela semanal arredondada para cima', () => {
    // R$ 1.000 a 20% ao mês por 52/12 semanas = 1 mês: R$ 1.200.
    const { installment, totalDue } = quote(1_000, { monthlyRate: 20, weeks: 4 });
    expect(installment).toBe(Math.ceil((1_000 * (1 + 0.2 * (4 / (52 / 12)))) / 4));
    expect(totalDue).toBe(installment * 4);
  });

  it('chance de pagar cai com o risco e com a taxa; chance de quebrar sobe', () => {
    const base = { risk: 0.3, monthlyRate: 20, broke: false };
    expect(payChance({ ...base, risk: 0.8 })).toBeLessThan(payChance(base));
    expect(payChance({ ...base, monthlyRate: 60 })).toBeLessThan(payChance(base));
    expect(payChance({ ...base, broke: true })).toBeLessThan(payChance(base));
    expect(hazard({ ...base, monthlyRate: 60 })).toBeGreaterThan(hazard(base));
    expect(hazard({ ...base, risk: 0.8 })).toBeGreaterThan(hazard(base));
  });

  it('quem paga tudo quita, com lucro', () => {
    const s = withLoan(0.1);
    const loan = s.loans[0]!;
    const events: GameEvent[] = [];
    // x = 0,01 fica abaixo de toda chance de pagar, inclusive a de quem quebrou.
    const rng = fixedRng(0.01);
    for (let w = 1; w <= 10 && loan.status === 'active'; w++) {
      collect({ ...s, week: s.week + w }, loan, rng, events);
    }
    expect(loan.status).toBe('paid');
    expect(loan.totalPaid).toBe(loan.totalDue);
    expect(events.some((e) => e.type === 'settled' && e.profit > 0)).toBe(true);
  });

  it(`depois de ${params.payment.defaultAfterWeeks} semanas sem pagar vira calote`, () => {
    const s = withLoan(0.5);
    const loan = s.loans[0]!;
    const events: GameEvent[] = [];
    const rng = fixedRng(0.999);
    for (let w = 1; w <= params.payment.defaultAfterWeeks; w++) {
      collect({ ...s, week: s.week + w }, loan, rng, events);
    }
    expect(loan.status).toBe('defaulted');
    expect(events.filter((e) => e.type === 'missed')).toHaveLength(
      params.payment.defaultAfterWeeks - 1,
    );
    expect(events.at(-1)).toMatchObject({ type: 'defaulted', writtenOff: loan.totalDue });
  });

  it('juro mais alto dá mais calote (estatística com o bot)', () => {
    const defaultRate = (monthlyRate: number) => {
      let made = 0;
      let lost = 0;
      for (let seed = 1; seed <= 25; seed++) {
        const s = playBot(newGame(seed), 30, { monthlyRate, weeks: 8 });
        const old = s.loans.filter((l) => l.startWeek <= 16);
        made += old.length;
        lost += old.filter((l) => l.status === 'defaulted').length;
      }
      return lost / made;
    };
    expect(defaultRate(60)).toBeGreaterThan(defaultRate(10));
  });
});

describe('bot', () => {
  it('joga 50 semanas sem quebrar o motor, com e sem garantia', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const s = playBot(newGame(seed), 50, {
        monthlyRate: 25,
        weeks: 8,
        collateral: seed % 2 === 0,
      });
      expect(s.week).toBe(51);
      expect(Number.isInteger(s.cash)).toBe(true);
      expect(s.cash).toBeGreaterThanOrEqual(0);
      for (const l of s.loans) {
        expect(l.totalPaid).toBeLessThanOrEqual(l.totalDue);
        expect(l.paidInstallments).toBeLessThanOrEqual(l.weeks);
        if (l.status === 'paid') expect(l.totalPaid).toBe(l.totalDue);
      }
      const { lent, received, recovered } = s.stats;
      expect(s.cash).toBe(params.startingCash - lent + received + recovered);
      for (const l of s.loans) expect(l.recovered).toBeLessThanOrEqual(l.totalDue - l.totalPaid);
    }
  });

  it('exigir garantia dá menos calote líquido', () => {
    const lostShare = (collateral: boolean) => {
      let lent = 0;
      let lost = 0;
      for (let seed = 1; seed <= 25; seed++) {
        const s = playBot(newGame(seed), 30, { monthlyRate: 20, weeks: 8, collateral });
        lent += s.stats.lent;
        lost += s.stats.writtenOff;
      }
      return lost / lent;
    };
    expect(lostShare(true)).toBeLessThan(lostShare(false));
  });
});

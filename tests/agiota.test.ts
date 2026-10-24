import { describe, expect, it } from 'vitest';
import { params } from '../src/content/params';
import { collect, hazard, makeLoan, payChance, quote } from '../src/engine/agiota';
import { decide, newGame, step } from '../src/engine/game';
import type { Rng } from '../src/engine/rng';
import type { GameEvent, GameState } from '../src/engine/state';
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

function withLoan(risk: number, monthlyRate = 20, weeks = 4): GameState {
  const s = newGame(1);
  const req = { ...s.requests[0]!, risk, amount: 1_000 };
  return { ...s, requests: [], loans: [makeLoan(s, req, { monthlyRate, weeks })] };
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
  it('joga 50 semanas sem quebrar o motor', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const s = playBot(newGame(seed), 50, { monthlyRate: 25, weeks: 8 });
      expect(s.week).toBe(51);
      expect(Number.isInteger(s.cash)).toBe(true);
      expect(s.cash).toBeGreaterThanOrEqual(0);
      for (const l of s.loans) {
        expect(l.totalPaid).toBeLessThanOrEqual(l.totalDue);
        expect(l.paidInstallments).toBeLessThanOrEqual(l.weeks);
        if (l.status === 'paid') expect(l.totalPaid).toBe(l.totalDue);
      }
      const { lent, received } = s.stats;
      expect(s.cash).toBe(params.startingCash - lent + received);
    }
  });
});

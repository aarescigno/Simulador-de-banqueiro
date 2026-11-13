import { describe, expect, it } from 'vitest';
import { partLabels } from '../src/content/endings';
import { escLine, panel, routeOrder, routes, screen } from '../src/content/esc';
import { reportLines } from '../src/content/journal';
import { esc as E } from '../src/content/params';
import { laranjaFor } from '../src/content/pocket';
import { makeLoan } from '../src/engine/agiota';
import { endingFor } from '../src/engine/crisis';
import {
  carteiraSale,
  escAvailable,
  escOpenBlock,
  launder,
  launderQuote,
  openEsc,
  tickEsc,
} from '../src/engine/esc';
import { advanceWeeks, decide, newGame, step } from '../src/engine/game';
import { tickPolice } from '../src/engine/police';
import type { Rng } from '../src/engine/rng';
import type { Crisis, GameEvent, GameState, LaunderRoute, Loan } from '../src/engine/state';
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

/** Partida na semana dada, sem pedidos, sem empréstimos e com o caixa dado. */
function at(week: number, cash = 40_000): GameState {
  const s = newGame(1);
  return { ...s, week, requests: [], loans: [], cash };
}

const crisis: Crisis = {
  kind: 'processo',
  startWeek: 1,
  weeksLeft: 3,
  prisonChance: 0.7,
  lawyer: false,
};
const ROUTES: LaunderRoute[] = ['consultoria', 'fachada', 'laranja', 'devagar'];

function chosen(route: LaunderRoute, week = 20, cash = 40_000): GameState {
  return decide(at(week, cash), { type: 'launder', route });
}

function ready(route: LaunderRoute = 'consultoria'): GameState {
  const s = chosen(route, 24);
  s.week = 30;
  s.laundering!.readyWeek = 30;
  s.laundering!.capital = E.capital;
  return s;
}

function loanWith(s: GameState, totalDue: number, totalPaid: number, missedStreak: number): Loan {
  const loan = makeLoan(s, newGame(2).requests[0]!, {
    monthlyRate: 20,
    weeks: 8,
    collateral: null,
  });
  loan.totalDue = totalDue;
  loan.totalPaid = totalPaid;
  loan.missedStreak = missedStreak;
  return loan;
}

describe('escAvailable', () => {
  it('só da semana 20, sem crise, sem lavagem, no degrau 1', () => {
    expect(escAvailable(at(19))).toBe(false);
    expect(escAvailable(at(20))).toBe(true);
    expect({ ...at(20), crisis }).toSatisfy((s: GameState) => !escAvailable(s));
    expect(escAvailable(chosen('consultoria'))).toBe(false);
    expect(escAvailable({ ...at(20), tier: 2 })).toBe(false);
  });
  it('inquérito aberto não impede', () => {
    const s = at(20);
    s.police.inquiry = { startWeek: 18, weeksLeft: 2, lawyer: false, complaints: 0 };
    expect(escAvailable(s)).toBe(true);
  });
});

describe('launderQuote', () => {
  it('bate com a tabela', () => {
    const s = at(20);
    expect(launderQuote(s, 'consultoria')).toEqual({
      outlay: 31_875,
      cost: 6_875,
      fee: 0,
      fromLaranja: 0,
    });
    expect(launderQuote(s, 'fachada')).toEqual({
      outlay: 28_500,
      cost: 3_500,
      fee: 0,
      fromLaranja: 0,
    });
    expect(launderQuote(s, 'laranja').outlay).toBe(28_750);
    s.pocket.laranja = 10_000;
    expect(launderQuote(s, 'laranja')).toEqual({
      outlay: 18_250,
      cost: 2_500,
      fee: 750,
      fromLaranja: 10_000,
    });
    s.pocket.laranja = 40_000;
    expect(launderQuote(s, 'laranja')).toEqual({
      outlay: 2_500,
      cost: 2_500,
      fee: 0,
      fromLaranja: 25_000,
    });
    expect(launderQuote(s, 'devagar').outlay).toBe(0);
  });
});

describe('launder', () => {
  it('consultoria: imposto vai para spent', () => {
    const s = chosen('consultoria');
    expect(s.cash).toBe(40_000 - 31_875);
    expect(s.stats.spent).toBe(6_875);
    expect(s.laundering).toEqual({
      route: 'consultoria',
      startWeek: 20,
      capital: 25_000,
      readyWeek: 21,
    });
    const e = s.queue.find((q) => q.event.type === 'laundered')!.event;
    expect(e).toMatchObject({ type: 'laundered', route: 'consultoria', cost: 6_875 });
  });
  it('fachada: ponto e Simples, pronta em 6 semanas', () => {
    const s = chosen('fachada');
    expect(s.cash).toBe(40_000 - 28_500);
    expect(s.stats.spent).toBe(3_500);
    expect(s.laundering!.readyWeek).toBe(26);
  });
  it('laranja: usa primeiro o que está com ele; comissão em fees, luva em spent', () => {
    const s0 = at(20);
    s0.pocket.laranja = 10_000;
    const s = decide(s0, { type: 'launder', route: 'laranja' });
    expect(s.cash).toBe(40_000 - 18_250);
    expect(s.pocket.laranja).toBe(0);
    expect(s.stats.spent).toBe(2_500);
    expect(s.stats.fees).toBe(750);
    expect(s.laundering!.readyWeek).toBe(21);
    const e = s.queue.find((q) => q.event.type === 'laundered')!.event;
    expect(e).toMatchObject({ cost: 3_250, who: laranjaFor(1).short });
  });
  it('laranja com mais do que o capital: sobra com ele', () => {
    const s0 = at(20);
    s0.pocket.laranja = 40_000;
    const s = decide(s0, { type: 'launder', route: 'laranja' });
    expect(s.cash).toBe(40_000 - 2_500);
    expect(s.pocket.laranja).toBe(15_000);
  });
  it('devagar: nada sai agora; o capital começa em zero', () => {
    const s = chosen('devagar');
    expect(s.cash).toBe(40_000);
    expect(s.laundering).toEqual({ route: 'devagar', startWeek: 20, capital: 0, readyWeek: null });
  });
  it('erros: sem caixa, cedo, crise, lavagem em andamento', () => {
    expect(() => decide(at(20, 31_874), { type: 'launder', route: 'consultoria' })).toThrow();
    expect(() => decide(at(19), { type: 'launder', route: 'devagar' })).toThrow();
    expect(() => decide({ ...at(20), crisis }, { type: 'launder', route: 'devagar' })).toThrow();
    expect(() => decide(chosen('devagar'), { type: 'launder', route: 'devagar' })).toThrow();
    expect(() => launder(at(20, 0), 'consultoria')).toThrow();
  });
});

describe('step', () => {
  it('escAvailable só na semana 20', () => {
    const seen: number[] = [];
    let s = at(18);
    for (let i = 0; i < 5; i++) {
      const r = step(s, [], NEVER);
      if (r.events.some((e) => e.type === 'escAvailable')) seen.push(s.week);
      s = r.state;
    }
    expect(seen).toEqual([20]);
  });
  it('consultoria: escReady no fim da semana escolhida, abre na seguinte', () => {
    let s = chosen('consultoria', 25);
    const r = step(s, [], NEVER);
    expect(r.events.filter((e) => e.type === 'escReady')).toHaveLength(1);
    s = r.state;
    expect(s.week).toBe(26);
    expect(escOpenBlock(s)).toBeNull();
  });
  it('fachada: escReady no fim de w + 5', () => {
    let s = chosen('fachada', 25);
    const weeks: number[] = [];
    for (let i = 0; i < 7; i++) {
      const r = step(s, [], NEVER);
      if (r.events.some((e) => e.type === 'escReady')) weeks.push(s.week);
      s = r.state;
    }
    expect(weeks).toEqual([30]);
    expect(escOpenBlock(s)).toBeNull();
  });
  it('devagar: 1.500 por semana, 17 semanas, escReady uma vez', () => {
    let s = chosen('devagar', 25);
    let ready = 0;
    let weeks = 0;
    while (s.laundering!.readyWeek === null) {
      const r = step(s, [], NEVER);
      s = r.state;
      weeks += 1;
      ready += r.events.filter((e) => e.type === 'escReady').length;
      if (weeks === 1) expect(s.laundering!.capital).toBe(1_500);
    }
    expect(weeks).toBe(17);
    expect(s.laundering!.capital).toBe(25_000);
    expect(s.cash).toBe(40_000 - 25_000);
    expect(ready).toBe(1);
    for (let i = 0; i < 3; i++) {
      const r = step(s, [], NEVER);
      s = r.state;
      ready += r.events.filter((e) => e.type === 'escReady').length;
    }
    expect(ready).toBe(1);
  });
  it('devagar: transfere menos se o caixa não chega', () => {
    const s = chosen('devagar', 25, 600);
    const r = step(s, [], NEVER);
    expect(r.state.laundering!.capital).toBe(600);
    expect(r.state.cash).toBe(0);
  });
  it('devagar segue com crise aberta', () => {
    const s = { ...chosen('devagar', 25), crisis };
    const events: GameEvent[] = [];
    tickEsc(s, events);
    expect(s.laundering!.capital).toBe(1_500);
  });
});

describe('busca e a fachada', () => {
  function raidOn(s: GameState): GameEvent[] {
    s.police.heat = 30;
    s.police.inquiry = { startWeek: 20, weeksLeft: 1, lawyer: false, complaints: 0 };
    const events: GameEvent[] = [];
    tickPolice(s, ALWAYS, events, 'baixa');
    return events;
  }
  it('antes de pronta: o capital vai para blocked e a lavagem acaba', () => {
    const s = chosen('fachada', 22);
    s.week = 24;
    const events = raidOn(s);
    expect(events.map((e) => e.type)).toContain('fachadaCaught');
    expect(s.laundering).toBeNull();
    expect(s.pocket.blocked).toBe(25_000);
    expect(escAvailable(s)).toBe(true);
  });
  it('depois de pronta: a busca não mexe no capital', () => {
    const s = chosen('fachada', 22);
    s.week = 28;
    const events = raidOn(s);
    expect(events.map((e) => e.type)).not.toContain('fachadaCaught');
    expect(s.laundering!.capital).toBe(25_000);
    expect(s.pocket.blocked).toBe(0);
  });
});

describe('openEsc', () => {
  it('vende o caderninho, passa a sobra ao bolso e vira o degrau 2', () => {
    const s = ready();
    s.cash = 7_000;
    s.complaints = 3;
    s.police.raids = 1;
    s.police.bribes = 2;
    s.police.heat = 41.6;
    s.primoGone = true;
    s.incidents.mesada = 500;
    s.incidents.militia = 'paying';
    s.requests = [newGame(3).requests[0]!];
    s.loans = [loanWith(s, 1_000, 200, 0), loanWith(s, 2_000, 0, 2)];
    expect(carteiraSale(s).price).toBe(500);
    openEsc(s);
    expect(s.loans.map((l) => l.status)).toEqual(['sold', 'sold']);
    expect(s.loans.every((l) => l.endWeek === 30)).toBe(true);
    expect(s.stats.sold).toBe(500);
    expect(s.stats.writtenOff).toBe(0);
    expect(s.pocket.own).toBe(7_500);
    expect(s.cash).toBe(25_000);
    expect(s.tier).toBe(2);
    expect(s.laundering).toBeNull();
    expect(s.requests).toEqual([]);
    expect(s.esc).toEqual({
      openedWeek: 30,
      capital: 25_000,
      route: 'consultoria',
      soldLoans: 2,
      sold: 500,
      leftover: 7_500,
      ficha: {
        weeks: 30,
        complaints: 3,
        raids: 1,
        bribes: 2,
        heat: 42,
        primoGone: true,
        mesada: true,
        militia: 'paying',
      },
    });
  });
  it('erro com cada bloqueio', () => {
    expect(escOpenBlock(at(30))).toBe('notReady');
    expect(escOpenBlock(chosen('fachada', 22))).toBe('notReady');
    const c = { ...ready(), crisis };
    expect(escOpenBlock(c)).toBe('crisis');
    expect(() => openEsc(c)).toThrow();
    const i = ready();
    i.police.inquiry = { startWeek: 28, weeksLeft: 2, lawyer: false, complaints: 0 };
    expect(escOpenBlock(i)).toBe('inquiry');
    expect(() => openEsc(i)).toThrow();
    const d = ready();
    d.dilemmas = [{ id: 99, kind: 'rolar', week: 30, costs: { nao: 0 } }];
    expect(escOpenBlock(d)).toBe('dilemma');
    expect(() => openEsc(d)).toThrow();
    expect(escOpenBlock(ready())).toBeNull();
  });
  it('depois, step e decide lançam erro', () => {
    const s = decide(ready(), { type: 'openEsc' });
    expect(s.tier).toBe(2);
    expect(() => step(s)).toThrow('A ESC abre numa próxima versão.');
    expect(() => decide(s, { type: 'refuse', requestId: 1 })).toThrow(
      'A ESC abre numa próxima versão.',
    );
    expect(advanceWeeks(s, 3)).toBe(s);
  });
});

describe('finais com lavagem em andamento', () => {
  const kinds = ['aposentado', 'preso', 'morto', 'exilado'] as const;
  const part = (s: GameState, k: (typeof kinds)[number]) =>
    endingFor(s, k).parts.find((p) => p.part === 'esc')?.amount;
  it('conta o capital conforme a rota', () => {
    const c = chosen('consultoria');
    expect(kinds.map((k) => part(c, k))).toEqual([25_000, undefined, 25_000, undefined]);
    const l = chosen('laranja');
    expect(kinds.map((k) => part(l, k))).toEqual([25_000, 25_000, undefined, undefined]);
  });
  it('sem lavagem, nada muda', () => {
    for (const k of kinds) expect(part(at(30), k)).toBeUndefined();
  });
});

describe('bot com ESC', () => {
  it('não quebra e fecha as contas em todas as rotas', () => {
    for (const route of ROUTES) {
      for (let seed = 1; seed <= 20; seed++) {
        const s = playBot(newGame(seed), 50, { monthlyRate: 20, weeks: 8, esc: route });
        const { lent, received, recovered, sold, seized, spent, returned, betrayed, fees } =
          s.stats;
        const p = s.pocket;
        expect(
          s.cash +
            p.own +
            p.laranja +
            p.offshore +
            p.blocked +
            betrayed +
            fees +
            (s.laundering?.capital ?? 0),
        ).toBe(20_000 - lent + received + recovered + sold - seized - spent + returned);
        expect(s.cash).toBeGreaterThanOrEqual(0);
      }
    }
  }, 30_000);
});

describe('textos', () => {
  it('cada rota tem todos os textos', () => {
    const l = laranjaFor(1);
    for (const r of routeOrder) {
      const t = routes[r];
      for (const x of [t.name(l), t.what(l), t.cost('R$ 1'), t.term, t.risk(l)]) {
        expect(x.length).toBeGreaterThan(5);
      }
    }
    expect(Object.keys(screen.militia)).toHaveLength(4);
    expect(panel.sale(0, 'R$ 0')).toContain('zerado');
  });
  it('escLine cobre os quatro eventos e o Jornal os mostra', () => {
    const events: GameEvent[] = [
      { type: 'escAvailable' },
      { type: 'laundered', route: 'laranja', cost: 3_250, who: 'Wesley' },
      { type: 'escReady', route: 'devagar' },
      { type: 'fachadaCaught', amount: 25_000 },
    ];
    for (const e of events) expect(escLine(e)).not.toBeNull();
    for (const r of ROUTES) {
      expect(escLine({ type: 'laundered', route: r, cost: 1, who: 'X' })).not.toBeNull();
      expect(escLine({ type: 'escReady', route: r })).not.toBeNull();
    }
    const lines = reportLines({ week: 20, events, cash: 0, fear: 0, word: 0, heat: 0 });
    expect(lines.join(' ')).toContain('Wesley assinou o contrato social');
    expect(lines.join(' ')).toContain('Empresa Simples de Crédito');
    expect(partLabels.esc).toBe('Capital da ESC');
  });
});

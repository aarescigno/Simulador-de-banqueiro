import { describe, expect, it } from 'vitest';
import { pocket as params, police } from '../src/content/params';
import { laranjaFor } from '../src/content/pocket';
import { reportLines } from '../src/content/journal';
import { decide, newGame, step } from '../src/engine/game';
import { betrayChance, protectedWealth, tickPocket } from '../src/engine/pocket';
import { tickPolice } from '../src/engine/police';
import { serialize } from '../src/engine/save';
import type { Rng } from '../src/engine/rng';
import type { GameEvent, GameState } from '../src/engine/state';

function fixedRng(x: number): Rng {
  return {
    next: () => x,
    int: (min) => min,
    chance: (p) => x < p,
    pick: (items) => items[0]!,
    state: () => 0,
  };
}

function base(cash = 100_000): GameState {
  return { ...newGame(1), requests: [], cash };
}

const types = (events: GameEvent[]) => events.map((e) => e.type);

describe('guardar e tirar', () => {
  it('em seu nome: sem taxa, nos dois sentidos', () => {
    let s = decide(base(), { type: 'stash', to: 'own', amount: 10_000 });
    expect(s.cash).toBe(90_000);
    expect(s.pocket.own).toBe(10_000);
    expect(s.stats.fees).toBe(0);
    s = decide(s, { type: 'unstash', from: 'own', amount: 4_000 });
    expect(s.cash).toBe(94_000);
    expect(s.pocket.own).toBe(6_000);
    expect(s.queue.map((q) => q.event.type)).toEqual(['gameStarted', 'stashed', 'unstashed']);
  });

  it('laranja: 5% na ida, devolve sem custo', () => {
    let s = decide(base(), { type: 'stash', to: 'laranja', amount: 10_000 });
    expect(s.cash).toBe(90_000);
    expect(s.pocket.laranja).toBe(9_500);
    expect(s.stats.fees).toBe(500);
    s = decide(s, { type: 'unstash', from: 'laranja', amount: 9_500 });
    expect(s.cash).toBe(99_500);
    expect(s.pocket.laranja).toBe(0);
    expect(s.stats.fees).toBe(500);
  });

  it('lá fora: 10% na ida e na volta, marca o doleiro', () => {
    let s = decide(base(), { type: 'stash', to: 'offshore', amount: 10_000 });
    expect(s.pocket.offshore).toBe(9_000);
    expect(s.pocket.doleiro).toBe(true);
    s = decide(s, { type: 'unstash', from: 'offshore', amount: 9_000 });
    expect(s.cash).toBe(90_000 + 8_100);
    expect(s.pocket.offshore).toBe(0);
    expect(s.stats.fees).toBe(1_000 + 900);
  });

  it('a volta do exterior não tem mínimo', () => {
    let s = decide(base(), { type: 'stash', to: 'offshore', amount: 5_000 });
    s = decide(s, { type: 'unstash', from: 'offshore', amount: 10 });
    expect(s.cash).toBe(95_000 + 9);
  });

  it('erros: caixa, saldo, mínimo, valor inválido', () => {
    const s = base(8_000);
    expect(() => decide(s, { type: 'stash', to: 'own', amount: 8_001 })).toThrow();
    expect(() => decide(s, { type: 'unstash', from: 'own', amount: 1 })).toThrow();
    expect(() => decide(s, { type: 'stash', to: 'offshore', amount: 4_999 })).toThrow();
    expect(() => decide(s, { type: 'stash', to: 'own', amount: 0 })).toThrow();
    expect(() => decide(s, { type: 'stash', to: 'own', amount: -5 })).toThrow();
    expect(() => decide(s, { type: 'stash', to: 'own', amount: 10.5 })).toThrow();
    const t = decide(s, { type: 'stash', to: 'own', amount: 100 });
    expect(() => decide(t, { type: 'unstash', from: 'own', amount: 101 })).toThrow();
  });

  it('não muta o estado anterior', () => {
    const s = base();
    const before = JSON.stringify(s);
    decide(s, { type: 'stash', to: 'laranja', amount: 1_000 });
    expect(JSON.stringify(s)).toBe(before);
  });
});

describe('traição do laranja', () => {
  it('chance em 0, 10, 30, 50 e 100 mil', () => {
    expect(betrayChance(0)).toBe(0);
    expect(betrayChance(10_000)).toBeCloseTo(0.0008, 6);
    expect(betrayChance(30_000)).toBeCloseTo(0.0072, 6);
    expect(betrayChance(50_000)).toBeCloseTo(0.02, 6);
    expect(betrayChance(100_000)).toBe(params.laranja.betrayMax);
  });

  it('com rng 0 zera o laranja e soma o que levou', () => {
    const s = base();
    s.pocket.laranja = 20_000;
    const events: GameEvent[] = [];
    tickPocket(s, fixedRng(0), events);
    expect(s.pocket.laranja).toBe(0);
    expect(s.stats.betrayed).toBe(20_000);
    expect(types(events)).toEqual(['betrayed']);
    expect(reportLines({ week: 1, events, cash: 0, fear: 0, word: 0, heat: 0 })[0]).toContain(
      laranjaFor(1).short,
    );
  });

  it('sem saldo, não sorteia nada', () => {
    const s = base();
    const events: GameEvent[] = [];
    tickPocket(s, fixedRng(0), events);
    expect(events).toEqual([]);
  });
});

describe('doleiro', () => {
  it('só cai depois da primeira remessa, e soma atenção', () => {
    const s = base();
    const events: GameEvent[] = [];
    tickPocket(s, fixedRng(0), events);
    expect(events).toEqual([]);
    const t = decide(s, { type: 'stash', to: 'offshore', amount: 5_000 });
    tickPocket(t, fixedRng(0), events);
    expect(types(events)).toEqual(['doleiroCaught']);
    expect(t.police.heat).toBe(params.offshore.caughtHeat);
    expect(t.pocket.offshore).toBe(4_500);
  });

  it('a atenção não passa de 100', () => {
    const s = base();
    s.pocket.doleiro = true;
    s.police.heat = 90;
    tickPocket(s, fixedRng(0), []);
    expect(s.police.heat).toBe(100);
  });
});

describe('busca e bloqueio', () => {
  /** Busca no fim desta semana: inquérito com 1 semana, atenção e denúncias altas, rng 0. */
  function raidNow(s: GameState): GameEvent[] {
    s.police.inquiry = { startWeek: 1, weeksLeft: 1, lawyer: false, complaints: 20 };
    s.police.heat = 90;
    const events: GameEvent[] = [];
    tickPolice(s, fixedRng(0), events, 'alta');
    return events;
  }

  it('bloqueia o own com o prazo, sem tocar nos outros', () => {
    const s = base();
    s.pocket = { ...s.pocket, own: 30_000, laranja: 5_000, offshore: 7_000 };
    s.week = 10;
    const events = raidNow(s);
    expect(types(events)).toContain('raid');
    expect(events).toContainEqual({
      type: 'ownBlocked',
      amount: 30_000,
      until: 10 + params.block.weeks,
    });
    expect(s.pocket.own).toBe(0);
    expect(s.pocket.blocked).toBe(30_000);
    expect(s.pocket.blockedUntil).toBe(10 + params.block.weeks);
    expect(s.pocket.laranja).toBe(5_000);
    expect(s.pocket.offshore).toBe(7_000);
  });

  it('nova busca soma ao bloqueado e reinicia o prazo', () => {
    const s = base();
    s.pocket = { ...s.pocket, own: 10_000, blocked: 30_000, blockedUntil: 15 };
    s.week = 12;
    raidNow(s);
    expect(s.pocket.blocked).toBe(40_000);
    expect(s.pocket.blockedUntil).toBe(12 + params.block.weeks);
  });

  it('sem nada em seu nome, não há bloqueio', () => {
    const s = base();
    const events = raidNow(s);
    expect(types(events)).not.toContain('ownBlocked');
    expect(s.pocket.blockedUntil).toBe(0);
  });

  it('desbloqueia na semana certa', () => {
    const s = base();
    s.pocket = { ...s.pocket, own: 1_000, blocked: 30_000, blockedUntil: 20 };
    s.week = 19;
    let events: GameEvent[] = [];
    tickPocket(s, fixedRng(0.5), events);
    expect(s.pocket.blocked).toBe(30_000);
    s.week = 20;
    events = [];
    tickPocket(s, fixedRng(0.5), events);
    expect(events).toContainEqual({ type: 'unblocked', amount: 30_000 });
    expect(s.pocket.blocked).toBe(0);
    expect(s.pocket.own).toBe(31_000);
  });

  it('o step encadeia: guarda, avança e o dinheiro continua lá', () => {
    let s = decide(base(), { type: 'stash', to: 'own', amount: 10_000 });
    s = step(s).state;
    expect(s.pocket.own).toBe(10_000);
    expect(s.cash).toBeLessThanOrEqual(90_000 + 1);
  });
});

describe('protegido', () => {
  it('ignora o bloqueado', () => {
    const s = base();
    s.pocket = { own: 1, laranja: 2, offshore: 4, blocked: 100, blockedUntil: 9, doleiro: true };
    expect(protectedWealth(s)).toBe(7);
  });

  it('a busca não leva o que está no bolso', () => {
    expect(police.raid.cashShare).toBeGreaterThan(0);
    const s = base(100_000);
    const t = decide(s, { type: 'stash', to: 'laranja', amount: 60_000 });
    expect(protectedWealth(t)).toBe(57_000);
  });
});

describe('texto do jornal', () => {
  it('guardar e tirar viram linhas', () => {
    let s = decide(base(), { type: 'stash', to: 'laranja', amount: 10_000 });
    s = decide(s, { type: 'unstash', from: 'laranja', amount: 1_000 });
    const events = s.queue.map((q) => q.event);
    const lines = reportLines({ week: 1, events, cash: 0, fear: 0, word: 0, heat: 0 });
    expect(lines.some((l) => l.includes('comissão'))).toBe(true);
    expect(lines.some((l) => l.includes('devolveu'))).toBe(true);
  });
});

describe('save', () => {
  it('serializa o bolso', () => {
    const s = decide(base(), { type: 'stash', to: 'own', amount: 5 });
    expect(serialize(s)).toContain('"pocket"');
  });
});

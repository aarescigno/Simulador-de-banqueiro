import { describe, expect, it } from 'vitest';
import { advanceWeeks, newGame, step } from '../src/engine/game';
import { playBot } from '../sim/bot';
import { deserialize, exportSave, importSave, SaveError, serialize } from '../src/engine/save';
import { SAVE_VERSION } from '../src/engine/state';

describe('save', () => {
  it('ida e volta em JSON', () => {
    const s = playBot(newGame(99), 5, { monthlyRate: 20, weeks: 8 });
    expect(deserialize(serialize(s))).toEqual(s);
  });

  it('ida e volta como texto exportado', () => {
    const s = playBot(newGame(99), 5, { monthlyRate: 20, weeks: 8 });
    expect(importSave(exportSave(s))).toEqual(s);
  });

  it('continuar do save dá o mesmo resultado que não parar', () => {
    const s = advanceWeeks(newGame(3), 4);
    const reloaded = importSave(exportSave(s));
    expect(advanceWeeks(reloaded, 6)).toEqual(advanceWeeks(s, 6));
  });

  it('recusa lixo e versões futuras', () => {
    expect(() => importSave('oi')).toThrow(SaveError);
    expect(() => deserialize('{"saveVersion": 999}')).toThrow(SaveError);
  });
});

describe('migração', () => {
  it('save da versão 1 ganha garantias e negociação', () => {
    const s = advanceWeeks(newGame(3), 2);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- save antigo, sem tipo
    const v1 = JSON.parse(serialize(s)) as Record<string, any>;
    v1.saveVersion = 1;
    for (const r of v1.requests) {
      delete r.assets;
      delete r.maxRate;
      delete r.patience;
    }
    for (const l of v1.loans) {
      delete l.collateral;
      delete l.recovered;
    }
    delete v1.stats.recovered;
    const migrated = deserialize(JSON.stringify(v1));
    expect(migrated.saveVersion).toBe(SAVE_VERSION);
    expect(migrated.stats.recovered).toBe(0);
    for (const r of migrated.requests) {
      expect(r.assets[0]!.kind).toBe('celular');
      expect(r.maxRate).toBeGreaterThan(0);
    }
    expect(() => advanceWeeks(migrated, 3)).not.toThrow();
  });
});

describe('migração 2 → 3', () => {
  it('ganha política, medo, boca a boca e exceções', () => {
    const s = advanceWeeks(newGame(4), 3);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- save antigo, sem tipo
    const v2 = JSON.parse(serialize(s)) as Record<string, any>;
    v2.saveVersion = 2;
    for (const k of ['fear', 'word', 'complaints', 'policy']) delete v2[k];
    for (const l of v2.loans) {
      delete l.override;
      delete l.lastLevel;
    }
    for (const r of v2.journal) {
      delete r.fear;
      delete r.word;
    }
    delete v2.stats.forgiven;
    const m = deserialize(JSON.stringify(v2));
    expect(m.saveVersion).toBe(SAVE_VERSION);
    expect(m.fear).toBe(0);
    expect(m.word).toBe(30);
    expect(m.complaints).toBe(0);
    expect(m.policy.collection).toEqual({ conversa: 1, pressao: 2, primo: 4 });
    expect(m.stats.forgiven).toBe(0);
    for (const l of m.loans) expect(l.override).toBeNull();
    expect(() => advanceWeeks(m, 3)).not.toThrow();
  });
});

describe('migração 3 → 4', () => {
  it('ganha polícia zerada, dilemas e relatórios com atenção', () => {
    const s = advanceWeeks(newGame(7), 3);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- save antigo, sem tipo
    const v3 = JSON.parse(serialize(s)) as Record<string, any>;
    v3.saveVersion = 3;
    delete v3.police;
    delete v3.dilemmas;
    delete v3.stats.seized;
    for (const r of v3.journal) delete r.heat;
    const m = deserialize(JSON.stringify(v3));
    expect(m.saveVersion).toBe(SAVE_VERSION);
    expect(m.police).toEqual({ heat: 0, inquiry: null, cooldownUntil: 0, bribes: 0, raids: 0 });
    expect(m.dilemmas).toEqual([]);
    expect(m.stats.seized).toBe(0);
    for (const r of m.journal) expect(r.heat).toBe(0);
    expect(() => advanceWeeks(m, 3)).not.toThrow();
  });
});

describe('migração 4 → 5', () => {
  it('ganha bolso zerado e taxas', () => {
    const s = advanceWeeks(newGame(7), 3);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- save antigo, sem tipo
    const v4 = JSON.parse(serialize(s)) as Record<string, any>;
    v4.saveVersion = 4;
    delete v4.pocket;
    delete v4.stats.fees;
    delete v4.stats.betrayed;
    const m = deserialize(JSON.stringify(v4));
    expect(m.saveVersion).toBe(SAVE_VERSION);
    expect(m.pocket).toEqual({
      own: 0,
      laranja: 0,
      offshore: 0,
      blocked: 0,
      blockedUntil: 0,
      doleiro: false,
    });
    expect(m.stats.fees).toBe(0);
    expect(m.stats.betrayed).toBe(0);
    expect(() => advanceWeeks(m, 3)).not.toThrow();
  });
});

describe('migração 6 → 7', () => {
  it('ganha crise, fim e primo', () => {
    const s = playBot(newGame(7), 3, { monthlyRate: 20, weeks: 8 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- save antigo, sem tipo
    const v6 = JSON.parse(serialize(s)) as Record<string, any>;
    v6.saveVersion = 6;
    delete v6.crisis;
    delete v6.ended;
    delete v6.primoGone;
    const m = deserialize(JSON.stringify(v6));
    expect(m.saveVersion).toBe(SAVE_VERSION);
    expect(m.crisis).toBeNull();
    expect(m.ended).toBeNull();
    expect(m.primoGone).toBe(false);
    for (let i = 0; i < 3; i++) expect(() => step(m)).not.toThrow();
  });
});

describe('migração 7 → 8', () => {
  it('ganha degrau, lavagem, ESC e vendas', () => {
    const s = playBot(newGame(7), 3, { monthlyRate: 20, weeks: 8 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- save antigo, sem tipo
    const v7 = JSON.parse(serialize(s)) as Record<string, any>;
    v7.saveVersion = 7;
    delete v7.tier;
    delete v7.laundering;
    delete v7.esc;
    delete v7.stats.sold;
    const m = deserialize(JSON.stringify(v7));
    expect(m.saveVersion).toBe(SAVE_VERSION);
    expect(m.tier).toBe(1);
    expect(m.laundering).toBeNull();
    expect(m.esc).toBeNull();
    expect(m.stats.sold).toBe(0);
    let t = m;
    for (let i = 0; i < 3; i++) {
      expect(() => (t = step(t).state)).not.toThrow();
    }
  });
});

describe('migração 8 → 9', () => {
  const asV8 = (s: unknown) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- save antigo, sem tipo
    const v8 = JSON.parse(serialize(s as never)) as Record<string, any>;
    v8.saveVersion = 8;
    delete v8.policy.escCollection;
    delete v8.stats.distributed;
    return v8;
  };
  it('no degrau 1, só ganha os campos', () => {
    const s = playBot(newGame(7), 3, { monthlyRate: 20, weeks: 8 });
    const m = deserialize(JSON.stringify(asV8(s)));
    expect(m.saveVersion).toBe(SAVE_VERSION);
    expect(m.policy.escCollection).toEqual({ aviso: 1, serasa: 2, execucao: 4 });
    expect(m.stats.distributed).toBe(0);
    expect(m.tier).toBe(1);
    expect(m.requests).toEqual(s.requests);
  });
  it('no degrau 2, entra na ESC de verdade: fichas geradas e o step roda', () => {
    let s = playBot(newGame(7), 70, { monthlyRate: 20, weeks: 8, esc: 'consultoria' });
    expect(s.tier).toBe(2);
    const v8 = asV8(s);
    v8.requests = [];
    v8.fear = 55;
    v8.queue = [];
    s = deserialize(JSON.stringify(v8));
    expect(s.fear).toBe(0);
    expect(s.word).toBe(30);
    expect(s.requests.length).toBeGreaterThanOrEqual(1);
    expect(s.requests.every((r) => r.company)).toBe(true);
    expect(s.queue.some((q) => q.event.type === 'escOpened')).toBe(true);
    for (let i = 0; i < 3; i++) expect(() => (s = step(s).state)).not.toThrow();
  });
});

import { describe, expect, it } from 'vitest';
import { advanceWeeks, newGame } from '../src/engine/game';
import { playBot } from '../sim/bot';
import { deserialize, exportSave, importSave, SaveError, serialize } from '../src/engine/save';

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
    expect(migrated.saveVersion).toBe(2);
    expect(migrated.stats.recovered).toBe(0);
    for (const r of migrated.requests) {
      expect(r.assets[0]!.kind).toBe('celular');
      expect(r.maxRate).toBeGreaterThan(0);
    }
    expect(() => advanceWeeks(migrated, 3)).not.toThrow();
  });
});

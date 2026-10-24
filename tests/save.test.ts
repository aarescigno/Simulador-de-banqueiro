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

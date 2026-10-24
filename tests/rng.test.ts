import { describe, expect, it } from 'vitest';
import { createRng, seedFrom } from '../src/engine/rng';

describe('rng', () => {
  it('mesma semente, mesma sequência', () => {
    const a = createRng(42);
    const b = createRng(42);
    const xs = Array.from({ length: 100 }, () => a.next());
    const ys = Array.from({ length: 100 }, () => b.next());
    expect(xs).toEqual(ys);
  });

  it('retoma do estado gravado', () => {
    const a = createRng(7);
    for (let i = 0; i < 10; i++) a.next();
    const b = createRng(a.state());
    expect(b.next()).toBe(a.next());
  });

  it('fica em [0, 1) e int respeita os limites', () => {
    const r = createRng(1);
    for (let i = 0; i < 1000; i++) {
      const x = r.next();
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
      const n = r.int(1, 3);
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(3);
    }
  });

  it('semente de texto é estável', () => {
    expect(seedFrom('cida')).toBe(seedFrom('cida'));
    expect(seedFrom('123')).toBe(123);
  });
});

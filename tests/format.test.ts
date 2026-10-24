import { describe, expect, it } from 'vitest';
import { money, percent } from '../src/content/format';

describe('money', () => {
  it.each([
    [0, 'R$ 0'],
    [350, 'R$ 350'],
    [999, 'R$ 999'],
    [1_000, 'R$ 1 mil'],
    [20_000, 'R$ 20 mil'],
    [23_400, 'R$ 23,4 mil'],
    [23_449, 'R$ 23,4 mil'],
    [150_000, 'R$ 150 mil'],
    [999_400, 'R$ 999 mil'],
    [999_600, 'R$ 1 mi'],
    [1_500_000, 'R$ 1,5 mi'],
    [1_200_000_000, 'R$ 1,2 bi'],
    [-2_000, '−R$ 2 mil'],
  ])('%d → %s', (v, s) => {
    expect(money(v)).toBe(s);
  });
});

describe('percent', () => {
  it('usa vírgula', () => {
    expect(percent(12.5)).toBe('12,5%');
    expect(percent(20)).toBe('20%');
  });
});

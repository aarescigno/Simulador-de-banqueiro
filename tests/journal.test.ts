import { describe, expect, it } from 'vitest';
import { joinNames, reportLines } from '../src/content/journal';

describe('jornal', () => {
  it('junta nomes', () => {
    expect(joinNames(['Seu Jorge'])).toBe('Seu Jorge');
    expect(joinNames(['Seu Jorge', 'Dona Cida'])).toBe('Seu Jorge e Dona Cida');
    expect(joinNames(['A', 'B', 'C'])).toBe('A, B e C');
    expect(joinNames(['A', 'B', 'C', 'D', 'E'])).toBe('5 devedores');
  });

  it('resume a semana em tom seco', () => {
    const lines = reportLines({
      week: 3,
      cash: 23_400,
      events: [
        { type: 'paid', name: 'Seu Jorge', amount: 350 },
        { type: 'missed', name: 'Dona Cida', streak: 1 },
      ],
    });
    expect(lines).toEqual([
      'Seu Jorge pagou. Recebido: R$ 350.',
      'Dona Cida não pagou.',
      'Caixa: R$ 23,4 mil.',
    ]);
  });
});

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
      fear: 0,
      heat: 0,
      word: 30,
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

describe('jornal: garantias e negociação', () => {
  it('conta a garantia, a venda no calote e quem foi embora', () => {
    const lines = reportLines({
      week: 9,
      cash: 10_000,
      fear: 0,
      heat: 0,
      word: 30,
      events: [
        {
          type: 'defaulted',
          name: 'Rafael',
          writtenOff: 400,
          recovered: 2_500,
          collateral: 'moto',
        },
        {
          type: 'loanMade',
          name: 'Dona Rosa',
          amount: 1_000,
          monthlyRate: 15,
          weeks: 8,
          collateral: 'inss',
        },
        { type: 'walkedOut', name: 'Seu Jorge' },
      ],
    });
    expect(lines).toEqual([
      'Rafael não paga há 6 semanas. Moto recolhida e vendida: R$ 2,5 mil. Baixado: R$ 400.',
      'Emprestado a Dona Rosa: R$ 1 mil a 15% ao mês, 8 semanas. Garantia: o cartão do INSS.',
      'Seu Jorge não topou a taxa. Foi pedir a outro.',
      'Caixa: R$ 10 mil.',
    ]);
  });
});

describe('jornal: atenção policial', () => {
  it('conta ronda, inquérito, propina e busca', () => {
    const lines = reportLines({
      week: 12,
      cash: 8_000,
      fear: 0,
      heat: 0,
      word: 30,
      events: [
        { type: 'heatRose', band: 'alta' },
        { type: 'inquiryOpened' },
        { type: 'bribed', amount: 4_000 },
        { type: 'raid', seized: 5_000, lost: ['Seu Jorge'] },
      ],
    });
    const text = lines.join('\n');
    expect(text).toContain('Viatura parada na esquina.');
    expect(text).toContain('Inquérito aberto na delegacia');
    expect(text).toContain('Custo: R$');
    expect(text).toContain('O caderninho foi junto: Seu Jorge não paga mais.');
  });
});

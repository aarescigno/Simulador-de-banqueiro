import { describe, expect, it } from 'vitest';
import { advanceWeeks, devGiveMoney, newGame, step } from '../src/engine/game';

describe('motor', () => {
  it('é determinístico: mesma semente, mesmo resultado', () => {
    expect(advanceWeeks(newGame(2024), 20)).toEqual(advanceWeeks(newGame(2024), 20));
  });

  it('não altera o estado recebido', () => {
    const s = newGame(1);
    const copy = structuredClone(s);
    step(s);
    expect(s).toEqual(copy);
  });

  it('avança a semana e registra o relatório', () => {
    const { state, events } = step(newGame(1));
    expect(state.week).toBe(2);
    expect(state.journal).toHaveLength(1);
    expect(events).toContainEqual({ type: 'gameStarted' });
  });

  it('dinheiro do painel dev entra no caixa e marca a partida', () => {
    const s = devGiveMoney(newGame(1), 5_000);
    expect(s.cash).toBe(25_000);
    expect(s.devUsed).toBe(true);
  });
});

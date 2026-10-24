// Texto do Jornal a partir dos eventos do motor. Voz de relatório, frases curtas.
import type { GameEvent, WeekReport } from '../engine/state';
import { money } from './format';

export function eventLine(e: GameEvent): string | null {
  switch (e.type) {
    case 'gameStarted':
      return 'Abre o caderninho. Bairro novo, clientela velha.';
    case 'devMoney':
      return `Entrada sem explicação: ${money(e.amount)}.`;
  }
}

export function reportLines(r: WeekReport): string[] {
  const lines = r.events.map(eventLine).filter((l): l is string => l !== null);
  lines.push(`Caixa: ${money(r.cash)}.`);
  return lines;
}

export const SAVE_VERSION = 1;

/** Evento produzido pelo motor. O texto exibido fica em src/content/journal.ts. */
export type GameEvent = { type: 'gameStarted' } | { type: 'devMoney'; amount: number };

/** Evento agendado para uma semana futura. */
export interface ScheduledEvent {
  week: number;
  event: GameEvent;
}

export interface WeekReport {
  week: number;
  events: GameEvent[];
  cash: number;
}

export interface GameState {
  saveVersion: number;
  seed: number;
  rngState: number;
  /** Semana em andamento, começando em 1. */
  week: number;
  /** Caixa em reais inteiros. */
  cash: number;
  /** Fila de eventos agendados, em ordem de semana. */
  queue: ScheduledEvent[];
  /** Relatórios das semanas fechadas, do mais antigo ao mais novo. */
  journal: WeekReport[];
  /** Marca partidas mexidas pelo painel dev. */
  devUsed: boolean;
}

export const SAVE_VERSION = 2;

export interface Debtor {
  /** Nome completo, para a ficha. */
  name: string;
  /** Como o bairro chama: "Seu Jorge", "Dona Cida", "Rafael". */
  short: string;
  initials: string;
  profession: string;
}

export type CollateralKind = 'celular' | 'moto' | 'inss';

export interface Collateral {
  kind: CollateralKind;
  /** Valor de revenda; no cartão do INSS, o benefício mensal. */
  value: number;
}

/** Contraproposta do devedor: a maior taxa que topa com aquela garantia. */
export interface Counter {
  rate: number;
  collateral: CollateralKind | null;
}

export interface LoanRequest {
  id: number;
  week: number;
  debtor: Debtor;
  amount: number;
  reason: string;
  /** Risco oculto, de 0 a 1. */
  risk: number;
  /** O que o devedor tem para deixar em garantia. */
  assets: Collateral[];
  /** Oculto: maior taxa (% ao mês) que topa sem garantia. */
  maxRate: number;
  /** Oculto: quantas contrapropostas ainda faz antes de ir embora. */
  patience: number;
  counter?: Counter;
}

export interface Loan {
  id: number;
  debtor: Debtor;
  reason: string;
  risk: number;
  principal: number;
  /** Taxa em % ao mês. */
  monthlyRate: number;
  weeks: number;
  installment: number;
  totalDue: number;
  startWeek: number;
  paidInstallments: number;
  totalPaid: number;
  /** Semanas seguidas sem pagar. */
  missedStreak: number;
  /** Oculto: o devedor quebrou e quase não paga mais. */
  broke: boolean;
  collateral: Collateral | null;
  /** Quanto a garantia rendeu depois do calote. */
  recovered: number;
  status: 'active' | 'paid' | 'defaulted';
  endWeek?: number;
}

/** Evento produzido pelo motor. O texto exibido fica em src/content/journal.ts. */
export type GameEvent =
  | { type: 'gameStarted' }
  | { type: 'devMoney'; amount: number }
  | {
      type: 'loanMade';
      name: string;
      amount: number;
      monthlyRate: number;
      weeks: number;
      collateral: CollateralKind | null;
    }
  | { type: 'refused'; name: string }
  | { type: 'walkedOut'; name: string }
  | { type: 'expired'; name: string }
  | { type: 'paid'; name: string; amount: number }
  | { type: 'missed'; name: string; streak: number }
  | { type: 'settled'; name: string; profit: number }
  | {
      type: 'defaulted';
      name: string;
      writtenOff: number;
      recovered: number;
      collateral: CollateralKind | null;
    };

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

export interface Stats {
  lent: number;
  received: number;
  writtenOff: number;
  /** Recebido com a venda de garantias. */
  recovered: number;
}

export interface GameState {
  saveVersion: number;
  seed: number;
  rngState: number;
  /** Semana em andamento, começando em 1. */
  week: number;
  /** Caixa em reais inteiros. */
  cash: number;
  /** Pedidos desta semana, ainda sem resposta. */
  requests: LoanRequest[];
  loans: Loan[];
  nextId: number;
  stats: Stats;
  /** Fila de eventos agendados, em ordem de semana. */
  queue: ScheduledEvent[];
  /** Relatórios das semanas fechadas, do mais antigo ao mais novo. */
  journal: WeekReport[];
  /** Marca partidas mexidas pelo painel dev. */
  devUsed: boolean;
}

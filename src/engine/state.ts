export const SAVE_VERSION = 4;

export interface Debtor {
  /** Nome completo, para a ficha. */
  name: string;
  /** Como o bairro chama: "Seu Jorge", "Dona Cida", "Rafael". */
  short: string;
  initials: string;
  profession: string;
}

/** Nível de cobrança, do mais brando ao mais pesado. */
export type Level = 'conversa' | 'pressao' | 'primo';

/** Por nível, a partir de qual semana de atraso (1 a 5) ele vale; null = nunca. */
export type CollectionPolicy = Record<Level, number | null>;

export interface Policy {
  collection: CollectionPolicy;
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
  /** Exceção do jogador à regra de cobrança; null segue a regra. */
  override: Level | null;
  /** Nível aplicado na última semana de atraso. */
  lastLevel: Level | null;
  status: 'active' | 'paid' | 'defaulted' | 'forgiven' | 'lost';
  endWeek?: number;
}

/** Faixa da atenção policial; o número exato fica oculto. */
export type HeatBand = 'baixa' | 'media' | 'alta';

export interface Inquiry {
  startWeek: number;
  /** Semanas até a resolução; ao chegar a 0, resolve. */
  weeksLeft: number;
  lawyer: boolean;
  /** Denúncias recebidas com o inquérito aberto. */
  complaints: number;
}

export interface Police {
  /** Atenção, de 0 a 100 (oculta; o jogador vê a faixa). */
  heat: number;
  inquiry: Inquiry | null;
  /** Primeira semana em que um novo inquérito pode abrir. */
  cooldownUntil: number;
  /** Propinas pagas (cada uma encarece a próxima). */
  bribes: number;
  /** Buscas e apreensões sofridas. */
  raids: number;
}

export type DilemmaKind = 'inquerito';
export type DilemmaOption = 'pagar' | 'advogado' | 'correr';

/** Escolha pendente do jogador. `costs` é o preço de cada opção, congelado na abertura. */
export interface Dilemma {
  id: number;
  kind: DilemmaKind;
  week: number;
  costs: Record<DilemmaOption, number>;
}

export type ComplaintSource = 'pressao' | 'primo' | 'moto' | 'celular' | 'inss' | 'ambiente';

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
  | { type: 'paid'; name: string; amount: number; level?: Level | null }
  | { type: 'missed'; name: string; streak: number; level?: Level | null }
  | { type: 'forgiven'; name: string; amount: number }
  | { type: 'complaint'; source: ComplaintSource; name?: string }
  | { type: 'heatRose'; band: HeatBand }
  | { type: 'inquiryOpened' }
  | { type: 'bribed'; amount: number }
  | { type: 'lawyerHired'; amount: number }
  | { type: 'inquiryArchived' }
  | { type: 'raid'; seized: number; lost: string[] }
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
  /** Medo e boca a boca ao fechar a semana. */
  fear: number;
  word: number;
  /** Atenção policial ao fechar a semana. */
  heat: number;
}

export interface Stats {
  lent: number;
  received: number;
  writtenOff: number;
  /** Recebido com a venda de garantias. */
  recovered: number;
  /** Saldo de dívidas perdoadas. */
  forgiven: number;
  /** Caixa levado em buscas e apreensões. */
  seized: number;
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
  policy: Policy;
  /** Medo no bairro, de 0 a 100. */
  fear: number;
  /** Boca a boca, de 0 a 100. */
  word: number;
  /** Denúncias acumuladas. */
  complaints: number;
  police: Police;
  /** Escolhas pendentes; sem resposta até fechar a semana, valem a opção padrão. */
  dilemmas: Dilemma[];
  /** Fila de eventos agendados, em ordem de semana. */
  queue: ScheduledEvent[];
  /** Relatórios das semanas fechadas, do mais antigo ao mais novo. */
  journal: WeekReport[];
  /** Marca partidas mexidas pelo painel dev. */
  devUsed: boolean;
}

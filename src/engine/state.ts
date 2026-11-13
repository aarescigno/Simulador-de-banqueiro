export const SAVE_VERSION = 8;

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
  status: 'active' | 'paid' | 'defaulted' | 'forgiven' | 'lost' | 'sold';
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

/** As 20 ocorrências: 16 sorteáveis e 4 de seguimento (agendadas). */
export type IncidentId =
  | 'delegado'
  | 'milicia'
  | 'milicia_recado'
  | 'rival'
  | 'rolar'
  | 'bem'
  | 'pastor'
  | 'vereador'
  | 'vereador_paga'
  | 'radio'
  | 'fianca'
  | 'pm'
  | 'pm_paga'
  | 'assalto'
  | 'some'
  | 'tragedia'
  | 'gas'
  | 'decimo'
  | 'cartao'
  | 'jurado';

export type DilemmaKind = 'inquerito' | 'processo' | IncidentId;
/** Opção de um dilema; as válidas por tipo ficam em `dilemmaOptions` (src/engine/incidents.ts). */
export type DilemmaOption = string;

/**
 * Escolha pendente do jogador. `costs` é o preço de cada opção disponível, congelado na abertura;
 * opção que não está em `costs` não existe nesta ocorrência. `amount` é um valor só para o texto.
 */
export interface Dilemma {
  id: number;
  kind: DilemmaKind;
  week: number;
  loanId?: number;
  amount?: number;
  costs: Record<DilemmaOption, number>;
}

export type MilitiaState = 'none' | 'paying' | 'refused' | 'refusedTwice';

export interface ScheduledIncident {
  week: number;
  id: IncidentId;
  loanId?: number;
}

/** Ocorrências: histórico, agenda e efeitos contínuos. Os prazos `...Until` são a primeira semana sem o efeito. */
export interface Incidents {
  /** Última semana em que cada ocorrência aconteceu. */
  last: Partial<Record<IncidentId, number>>;
  scheduled: ScheduledIncident[];
  /** Mesada do delegado, em R$ por semana; 0 = não paga. */
  mesada: number;
  militia: MilitiaState;
  /** Fração do recebido na semana que a milícia leva. */
  militiaRate: number;
  rivalUntil: number;
  primoOutUntil: number;
  vereadorUntil: number;
  /** Choque de renda: soma na chance de pagar de quem não quebrou. */
  shock: { until: number; payDelta: number };
}

/** Crise do degrau 1: o processo (busca que virou denúncia) e o jurado (a milícia). */
export type CrisisKind = 'processo' | 'jurado';

export interface Crisis {
  kind: CrisisKind;
  startWeek: number;
  /** Semanas até o julgamento (processo) ou até o fim da ameaça (jurado). */
  weeksLeft: number;
  /** Chance de condenação no julgamento; no jurado, 0. */
  prisonChance: number;
  lawyer: boolean;
}

/** Como a partida termina. */
export type Ending = 'preso' | 'morto' | 'exilado' | 'aposentado';

/** Parcelas do placar de um final. */
export type EndingPart = 'cash' | 'own' | 'blocked' | 'laranja' | 'offshore' | 'esc';

export interface Ended {
  kind: Ending;
  week: number;
  score: number;
  parts: { part: EndingPart; amount: number }[];
}

export type Compartment = 'own' | 'laranja' | 'offshore';

export interface Pocket {
  /** Em seu nome: sem custo, mas a busca bloqueia. */
  own: number;
  /** No nome do laranja: comissão na ida, risco de sumir com tudo. */
  laranja: number;
  /** Lá fora, com o doleiro: taxa nos dois sentidos, risco de ele ser preso. */
  offshore: number;
  /** Em seu nome, congelado pela Justiça; não se move e não conta como protegido. */
  blocked: number;
  /** Semana em que o bloqueio acaba. */
  blockedUntil: number;
  /** Já mandou dinheiro ao doleiro (para sempre). */
  doleiro: boolean;
}

/** Como o capital da ESC é lavado. */
export type LaunderRoute = 'consultoria' | 'fachada' | 'laranja' | 'devagar';

/** Lavagem em andamento: o capital separado fica fora do caixa até a ESC abrir. */
export interface Laundering {
  route: LaunderRoute;
  startWeek: number;
  /** Já separado do caixa; no devagar, cresce a cada semana. */
  capital: number;
  /** Primeira semana em que a ESC pode abrir; null enquanto o devagar não completa. */
  readyWeek: number | null;
}

/** Foto do degrau 1 na abertura da ESC. */
export interface Ficha {
  weeks: number;
  complaints: number;
  raids: number;
  bribes: number;
  heat: number;
  primoGone: boolean;
  mesada: boolean;
  militia: MilitiaState;
}

/** A ESC aberta (degrau 2). */
export interface Esc {
  openedWeek: number;
  capital: number;
  route: LaunderRoute;
  /** Empréstimos na rua vendidos ao colega do ramo. */
  soldLoans: number;
  /** Preço da venda do caderninho. */
  sold: number;
  /** Caixa que sobrou do degrau 1 e foi para o bolso em seu nome. */
  leftover: number;
  ficha: Ficha;
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
  | { type: 'stashed'; to: Compartment; amount: number; fee: number; who: string }
  | { type: 'unstashed'; from: Compartment; amount: number; fee: number; who: string }
  | { type: 'betrayed'; amount: number; who: string }
  | { type: 'doleiroCaught' }
  | { type: 'ownBlocked'; amount: number; until: number }
  | { type: 'unblocked'; amount: number }
  | { type: 'settled'; name: string; profit: number }
  | { type: 'incident'; id: IncidentId; name?: string; amount?: number }
  | {
      type: 'incidentChoice';
      id: DilemmaKind;
      option: DilemmaOption;
      name?: string;
      amount?: number;
    }
  | { type: 'crisisOpened'; kind: CrisisKind }
  | { type: 'crisisEnded'; kind: CrisisKind; how: 'absolvido' | 'sobreviveu' }
  | { type: 'escAvailable' }
  | { type: 'laundered'; route: LaunderRoute; cost: number; who: string }
  | { type: 'escReady'; route: LaunderRoute }
  | { type: 'fachadaCaught'; amount: number }
  | { type: 'mesadaFailed' }
  | { type: 'militiaCut'; amount: number }
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
  /** Taxas pagas a laranja e doleiro. */
  fees: number;
  /** Levado por laranjas que sumiram. */
  betrayed: number;
  /** Saiu do caixa por dilemas, mesada, milícia e assaltos. */
  spent: number;
  /** Voltou ao caixa de favores (vereador e PM). */
  returned: number;
  /** Recebido com a venda do caderninho ao abrir a ESC. */
  sold: number;
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
  /** O que está fora do caixa. */
  pocket: Pocket;
  /** Ocorrências: histórico, agenda e efeitos contínuos. */
  incidents: Incidents;
  /** Escolhas pendentes; sem resposta até fechar a semana, valem a opção padrão. */
  dilemmas: Dilemma[];
  /** Fila de eventos agendados, em ordem de semana. */
  queue: ScheduledEvent[];
  /** Relatórios das semanas fechadas, do mais antigo ao mais novo. */
  journal: WeekReport[];
  /** Crise aberta, se houver; uma por vez. */
  crisis: Crisis | null;
  /** Fim da partida, se acabou; com ele, `step` e `decide` lançam erro. */
  ended: Ended | null;
  /** O primo foi entregue: vira pressão para sempre. */
  primoGone: boolean;
  /** Degrau da partida: 1 = agiota, 2 = ESC. */
  tier: number;
  /** Lavagem do capital da ESC em andamento, se houver. */
  laundering: Laundering | null;
  /** A ESC aberta; só existe no degrau 2. */
  esc: Esc | null;
  /** Marca partidas mexidas pelo painel dev. */
  devUsed: boolean;
}

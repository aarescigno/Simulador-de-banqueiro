// Parâmetros de balanço. Diversão vence realismo nos números; a direção de cada efeito é real:
// devedor mais arriscado e juro mais alto pagam menos e quebram mais.
import type { Level } from '../engine/state';
export const params = {
  startingCash: 20_000,
  /** Semanas de jornal guardadas no save. */
  journalWeeks: 104,

  requests: {
    /** Pedidos por semana: sorteio entre min e max, mais floor(boca a boca / wordDivisor + sorteio), até maxTotal. */
    perWeek: [1, 2] as const,
    wordDivisor: 50,
    maxTotal: 5,
    /** Risco base: soma de dois sorteios, antes dos ajustes de profissão e motivo. */
    baseRisk: [0.5, 0.3] as const,
    riskClamp: [0.02, 0.98] as const,
  },

  terms: {
    /** Taxa em % ao mês. */
    rate: { min: 1, max: 100, step: 1, default: 20 },
    /** Prazo em semanas. */
    weeks: { min: 2, max: 26, step: 1, default: 8 },
  },

  payment: {
    /** Chance semanal de pagar a parcela: base − risco × peso − (taxa/100) × peso. */
    base: 0.95,
    riskWeight: 0.35,
    rateWeight: 0.25,
    min: 0.05,
    /** Quem atrasou pode pagar duas parcelas de uma vez. */
    catchUp: 0.35,
    /**
     * Chance semanal de o devedor "quebrar" de vez (perde o emprego, some, arruma outra dívida):
     * base + risco × peso + (taxa/100)² × peso. Quadrática na taxa: juro alto demais deixa de compensar.
     */
    hazardBase: 0.002,
    hazardRisk: 0.03,
    hazardRate: 0.4,
    /** Chance de pagar depois de quebrar. */
    brokePay: 0.05,
    /** Semanas seguidas sem pagar até virar calote. */
    defaultAfterWeeks: 6,
  },

  /**
   * Negociação: cada devedor tem uma taxa máxima oculta, que sobe com o risco (quem está
   * desesperado topa qualquer coisa; quem tem opção pechincha). Acima dela, faz contraproposta.
   */
  negotiation: {
    /** Taxa máxima sem garantia: base + risco × peso + sorteio em [0, spread). */
    base: 12,
    riskWeight: 45,
    spread: 30,
    /** Contrapropostas antes de ir pedir a outro: sorteio entre min e max. */
    patience: [1, 2] as const,
  },

  /**
   * Garantias. Quem deixa garantia paga mais (tem o que perder) e topa menos juro.
   * ratePenalty: pontos de taxa a menos que o devedor aceita ao deixar a garantia.
   * payBonus: soma na chance semanal de pagar. recovery: fração do valor recuperada no calote.
   */
  collateral: {
    celular: { ratePenalty: 5, payBonus: 0.03, recovery: 0.4, value: [400, 1_500] as const },
    moto: {
      ratePenalty: 15,
      payBonus: 0.06,
      /** Moto sem documento sai pela metade da metade. */
      recovery: 0.3,
      value: [3_000, 9_000] as const,
      /** Chance de ter moto, quando a profissão não diz outra. */
      chance: 0.15,
    },
    /**
     * Cartão do benefício retido: o agiota saca direto. Paga mesmo quando o devedor quebrou;
     * no calote, o banco bloqueia o cartão e não se recupera nada.
     */
    inss: {
      ratePenalty: 18,
      payBonus: 0.15,
      recovery: 0,
      brokePay: 0.7,
      value: [1_500, 2_800] as const,
    },
  },
};

/**
 * Cobrança por política. Em cada nível: payBonus soma na chance de pagar, brokePay na de quem
 * quebrou, hazard na de quebrar; fear e word mexem no medo e no boca a boca; complaint é a chance
 * de denúncia. Tudo isso acontece uma vez por semana em atraso, pague ou não.
 */
export const collection = {
  maxThreshold: 5,
  defaultPolicy: { conversa: 1, pressao: 2, primo: 4 } as const,
  levels: {
    conversa: { payBonus: 0.08, brokePay: 0, hazard: 0, fear: 0.3, word: 0, complaint: 0 },
    pressao: { payBonus: 0.16, brokePay: 0.05, hazard: 0.02, fear: 1, word: -0.5, complaint: 0.02 },
    primo: { payBonus: 0.42, brokePay: 0.18, hazard: 0.03, fear: 2.8, word: -3, complaint: 0.06 },
  },
  fear: {
    /** Medo × decay a cada semana, depois dos ganhos. */
    decay: 0.85,
    /** Soma em payChance de todo devedor não quebrado: payBonus × medo/100. */
    payBonus: 0.12,
    /** Soma no risco bruto de quem pede: riskBonus × medo/100. */
    riskBonus: 0.1,
    /** Chance semanal de denúncia ambiente: ambient × medo/100. */
    ambient: 0.03,
  },
  word: {
    start: 30,
    /** Fração da distância até o valor inicial que ele anda por semana. */
    drift: 0.05,
    loanMade: 1,
    settled: 1,
    forgiven: 4,
  },
  /** Custo de tomar a garantia no calote. */
  seized: {
    celular: { fear: 1, word: -3, complaint: 0.1 },
    moto: { fear: 4, word: -8, complaint: 0.3 },
  },
  /** Cartão do INSS: custo no boca a boca ao fechar o empréstimo e denúncia semanal enquanto retido. */
  inss: { wordOnLend: -4, complaintPerWeek: 0.02 },
  forgive: { fear: -2 },
};

export const WEEKS_PER_MONTH = 52 / 12;

/**
 * Atenção policial. Denúncia vira atenção, atenção vira inquérito, inquérito vira busca.
 * O jogador só vê a faixa; os números ficam ocultos.
 */
export const police = {
  /** Atenção × decay a cada semana. */
  decay: 0.92,
  /** Atenção somada por denúncia, pela origem. */
  complaint: { ambiente: 12, pressao: 15, celular: 20, inss: 25, moto: 30, primo: 30 },
  /** Boca a boca acima disso vira atenção: (boca − wordFloor) × wordWeight por semana. */
  wordFloor: 50,
  wordWeight: 0.04,
  /** Faixa média a partir de medium, alta a partir de high. */
  bands: { medium: 20, high: 50 },
  /** Chance semanal de abrir inquérito, por faixa. */
  inquiryChance: { baixa: 0, media: 0.04, alta: 0.12 },
  /** Semanas sem novo inquérito depois de um encerrar. */
  cooldown: 6,
  inquiry: {
    /** Duração do inquérito, em semanas. */
    weeks: 4,
    /** Evidência = atenção + perComplaint × denúncias do inquérito; com advogado, × lawyerFactor. */
    perComplaint: 10,
    lawyerFactor: 0.5,
    /** Chance de busca = (evidência − raidOffset) / raidScale, entre raidMin e raidMax. */
    raidOffset: 10,
    raidScale: 80,
    raidMin: 0.05,
    raidMax: 0.9,
    /** Pedidos a menos por semana com inquérito aberto. */
    requestPenalty: 1,
  },
  /** Propina: max(min, cashShare × caixa) × growth^propinas já pagas, arredondada a 100. */
  bribe: { min: 1_500, cashShare: 0.2, growth: 1.5 },
  lawyer: 3_000,
  /** Busca: fração do caixa levada, chance de perder cada empréstimo, e o que sobra de atenção e medo. */
  raid: { cashShare: 0.5, loanLoss: 0.35, heatAfter: 0.5, fearAfter: 0.5 },
  archived: { heatAfter: 0.7 },
};

/**
 * Bolso: o que o jogador tira do caixa e guarda. O caixa é o negócio (a busca leva parte dele);
 * o bolso é o placar. Em seu nome não custa nada, mas a busca bloqueia. O laranja cobra
 * comissão e pode sumir com tudo. O doleiro cobra nos dois sentidos e pode ser preso.
 */
export const pocket = {
  laranja: {
    /** Comissão sobre cada depósito. */
    fee: 0.05,
    /** Chance semanal de sumir com tudo = min(betrayMax, betrayScale × (saldo / betrayRef)²). */
    betrayScale: 0.02,
    betrayRef: 50_000,
    betrayMax: 0.05,
  },
  offshore: {
    /** Taxa do doleiro na ida e na volta. */
    fee: 0.1,
    /** Remessa mínima (a volta não tem mínimo). */
    min: 5_000,
    /** Chance semanal de o doleiro ser preso, depois da primeira remessa. */
    caughtChance: 0.004,
    /** Atenção policial somada quando o doleiro cai. */
    caughtHeat: 25,
  },
  /** Semanas que o bloqueio judicial dura (nova busca reinicia). */
  block: { weeks: 14 },
};

/**
 * Ocorrências: delegado, milícia, rival, devedor que some e outras. No fim de cada semana, com
 * chance `chance`, uma ocorrência elegível é sorteada pelo peso. Uma `Row` vale para as sorteáveis:
 * peso, primeira semana em que pode sair e intervalo de repetição (null = acontece uma vez).
 * Atenção mexida aqui não é denúncia: soma direto na atenção.
 */
export const incidents = {
  /** Chance semanal de sortear uma ocorrência. */
  chance: 0.35,
  /** Multiplicadores da chance de inquérito: com mesada paga e com o vereador na mão. */
  inquiryFactor: { mesada: 0.4, vereador: 0.6 },

  delegado: {
    weight: 3,
    minWeek: 6,
    cooldown: 12 as number | null,
    mesada: 600,
    heatRefuse: 10,
    heatMesada: -10,
    heatFail: 15,
  },
  milicia: {
    weight: 3,
    minWeek: 8,
    cooldown: null as number | null,
    minReceived: 10_000,
    rate: 0.1,
    fearPay: 5,
    recadoWeeks: 3,
  },
  milicia_recado: { rate: 0.15, cashLoss: 0.4, fearFactor: 0.5, primoOutWeeks: 6 },
  rival: {
    weight: 3,
    minWeek: 6,
    cooldown: 15 as number | null,
    weeks: 8,
    requestPenalty: 1,
    rateCut: 8,
    heatPrimo: 15,
    fearPrimo: 5,
  },
  rolar: {
    weight: 4,
    minWeek: 3,
    cooldown: 4 as number | null,
    minLate: 2,
    maxCatchUp: 2,
    extraWeeks: 3,
  },
  bem: {
    weight: 3,
    minWeek: 3,
    cooldown: 6 as number | null,
    minLate: 3,
    recovery: 0.25,
    fear: 1,
    word: -2,
    wordNews: -2,
  },
  pastor: {
    weight: 2,
    minWeek: 4,
    cooldown: 12 as number | null,
    cost: 1_000,
    wordRefuse: -2,
    wordGive: 6,
    heatGive: -5,
  },
  vereador: {
    weight: 2,
    minWeek: 10,
    cooldown: null as number | null,
    cost: 5_000,
    weeks: 20,
    payChance: 0.4,
  },
  radio: {
    weight: 2,
    minWeek: 6,
    cooldown: 10 as number | null,
    minComplaints: 2,
    heatIgnore: 8,
    wordIgnore: -5,
    cost: 1_500,
    heatPay: -8,
  },
  fianca: {
    weight: 3,
    minWeek: 5,
    cooldown: 12 as number | null,
    cost: 2_000,
    primoOutWeeks: 6,
    heatLeave: 15,
  },
  pm: {
    weight: 2,
    minWeek: 8,
    cooldown: 20 as number | null,
    cost: 3_000,
    heatRefuse: 5,
    heatLend: -12,
    weeks: 10,
    payChance: 0.5,
  },
  assalto: {
    weight: 2,
    minWeek: 5,
    cooldown: 15 as number | null,
    minCash: 15_000,
    cashLoss: 0.25,
  },
  some: { weight: 3, minWeek: 4, cooldown: 6 as number | null, minRisk: 0.5, word: -1 },
  tragedia: {
    weight: 1,
    minWeek: 8,
    cooldown: 20 as number | null,
    minLate: 3,
    /** Só depois destes níveis de cobrança: a tragédia vem do primo, não da ligação. */
    levels: ['primo'] as Level[],
    word: -10,
    heat: 20,
  },
  gas: { weight: 2, minWeek: 4, cooldown: 16 as number | null, payDelta: -0.06, weeks: 4 },
  decimo: {
    weight: 3,
    minWeek: 20,
    cooldown: null as number | null,
    payDelta: 0.08,
    weeks: 2,
  },
  cartao: { weight: 2, minWeek: 6, cooldown: 10 as number | null },
};

/**
 * Crise do degrau 1: o processo (busca e apreensão que vira denúncia) e o jurado (a milícia
 * cobra a recusa). Termina em preso, morto ou exilado, ou o jogador escapa. Uma crise por vez.
 */
export const crisis = {
  /** O processo abre na busca e apreensão se as buscas somarem isto ou mais... */
  raidsForTrial: 2,
  /** ...ou se a evidência daquela resolução do inquérito for isto ou mais. */
  evidenceForTrial: 60,
  /** Semanas até o julgamento. */
  trialWeeks: 6,
  /** Chance de condenação no julgamento, sem advogado. */
  prisonChance: 0.7,
  /** Advogado de defesa: custo e a chance de condenação com ele. */
  lawyer: { cost: 8_000, prisonChance: 0.15 },
  /**
   * Acordo com o delegado: max(min, cashShare × caixa) × growth das propinas já pagas,
   * arredondado a 100 (a metade com mesada em dia). Depois, a atenção fica em heatAfter.
   */
  deal: { min: 8_000, cashShare: 0.4, mesadaDiscount: 0.5, heatAfter: 40 },
  /** Entregar o primo: o medo cai para esta fração e a atenção fica em heatAfter. */
  snitch: { fearAfter: 0.3, heatAfter: 30 },
  /** Sumir por uns tempos: semanas fora. */
  vanish: { weeks: 8 },
  /** Exílio: fração do caixa que vai na mala. */
  exile: { cashShare: 0.5 },
  /**
   * Jurado: semanas entre a segunda recusa à milícia e o recado, duração, chance semanal de
   * morte ao ficar, fração do caixa para pagar e a parte da milícia depois.
   */
  hit: { delay: 4, weeks: 4, deathChance: 0.12, payShare: 0.6, militiaRate: 0.2 },
  /** Aposentar vale a partir desta semana. */
  retireFromWeek: 20,
  /** Absolvido: a atenção cai para esta fração. */
  acquittedHeatAfter: 0.5,
};

// Parâmetros de balanço. Diversão vence realismo nos números; a direção de cada efeito é real:
// devedor mais arriscado e juro mais alto pagam menos e quebram mais.
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

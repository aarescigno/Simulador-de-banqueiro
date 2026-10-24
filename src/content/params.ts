// Parâmetros de balanço. Diversão vence realismo nos números; a direção de cada efeito é real:
// devedor mais arriscado e juro mais alto pagam menos e quebram mais.
export const params = {
  startingCash: 20_000,
  /** Semanas de jornal guardadas no save. */
  journalWeeks: 104,

  requests: {
    perWeek: [1, 3] as const,
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
    defaultAfterWeeks: 4,
  },
};

export const WEEKS_PER_MONTH = 52 / 12;

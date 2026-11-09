// Bot simples: aceita todo pedido que cabe no caixa, sempre com a mesma taxa e prazo.
// Se o devedor contrapropõe, topa a contraproposta (ou não, conforme a opção).
import {
  canAccept,
  decide,
  step,
  type CollateralKind,
  type Compartment,
  type CollectionPolicy,
  type DilemmaOption,
  type GameState,
} from '../src/engine';
import { pocket } from '../src/content/params';

export interface BotOptions {
  monthlyRate: number;
  weeks: number;
  /** Recusa pedidos acima desta fração do caixa. */
  maxShare?: number;
  /** Topa a contraproposta do devedor. Padrão: sim. */
  takeCounter?: boolean;
  /** Exige a garantia mais forte que o devedor tiver. */
  collateral?: boolean;
  /** Política de cobrança; padrão do jogo se omitida. */
  policy?: CollectionPolicy;
  /** Resposta ao dilema do inquérito (INQ=...); sem caixa para a opção, corre. Padrão: correr. */
  inquiry?: DilemmaOption;
  /** Guarda o caixa acima de POCKET_KEEP neste compartimento (POCKET=...). Padrão: nenhum. */
  pocket?: Compartment | null;
}

/** Caixa que o bot mantém para emprestar; o resto vai para o bolso. */
export const POCKET_KEEP = 15_000;

/** Políticas de cobrança do sim (POLICY=...). */
export const policies: Record<string, CollectionPolicy> = {
  nada: { conversa: null, pressao: null, primo: null },
  conversa: { conversa: 1, pressao: null, primo: null },
  padrao: { conversa: 1, pressao: 2, primo: 4 },
  primo: { conversa: null, pressao: null, primo: 1 },
};

const strongest: CollateralKind[] = ['inss', 'moto', 'celular'];

/** Responde a todos os pedidos da semana. */
export function botDecide(state: GameState, o: BotOptions): GameState {
  let s = state;
  if (o.pocket) {
    const excess = s.cash - POCKET_KEEP;
    const min = o.pocket === 'offshore' ? pocket.offshore.min : 1;
    if (excess >= min) s = decide(s, { type: 'stash', to: o.pocket, amount: excess });
  }
  for (const d of state.dilemmas) {
    const want = o.inquiry ?? 'correr';
    const option = d.costs[want] <= s.cash ? want : 'correr';
    s = decide(s, { type: 'choose', dilemmaId: d.id, option });
  }
  for (const r of state.requests) {
    if (!canAccept(s, r.id) || r.amount > s.cash * (o.maxShare ?? 1)) {
      s = decide(s, { type: 'refuse', requestId: r.id });
      continue;
    }
    const collateral = o.collateral
      ? (strongest.find((k) => r.assets.some((a) => a.kind === k)) ?? null)
      : null;
    const terms = { monthlyRate: o.monthlyRate, weeks: o.weeks, collateral };
    s = decide(s, { type: 'accept', requestId: r.id, ...terms });
    const counter = s.requests.find((x) => x.id === r.id)?.counter;
    if (counter && (o.takeCounter ?? true)) {
      s = decide(s, { type: 'accept', requestId: r.id, ...terms, monthlyRate: counter.rate });
    }
  }
  return s;
}

export function playBot(start: GameState, weeks: number, o: BotOptions): GameState {
  let s = start;
  if (o.policy) s = decide(s, { type: 'setPolicy', collection: o.policy });
  for (let i = 0; i < weeks; i++) s = step(botDecide(s, o)).state;
  return s;
}

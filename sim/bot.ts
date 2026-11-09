// Bot simples: aceita todo pedido que cabe no caixa, sempre com a mesma taxa e prazo.
// Se o devedor contrapropõe, topa a contraproposta (ou não, conforme a opção).
import {
  canAccept,
  decide,
  step,
  type CollateralKind,
  type Compartment,
  type CollectionPolicy,
  type Dilemma,
  type DilemmaOption,
  defaultOption,
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
  /**
   * Resposta às outras ocorrências (INC=...): `padrao` deixa valer a opção padrão; `paga` escolhe
   * a outra opção quando o caixa cobre (na milícia, paga); `recusa` recusa tudo (na milícia, recusa).
   * Padrão: padrao.
   */
  incidents?: 'padrao' | 'paga' | 'recusa';
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

function inquiryOption(s: GameState, d: Dilemma, o: BotOptions): DilemmaOption {
  const want = o.inquiry ?? 'correr';
  return (d.costs[want] ?? Infinity) <= s.cash ? want : 'correr';
}

function incidentOption(s: GameState, d: Dilemma, o: BotOptions): DilemmaOption {
  const options = Object.keys(d.costs);
  const first = defaultOption(d.kind);
  const militia = d.kind === 'milicia' || d.kind === 'milicia_recado';
  const mode = o.incidents ?? 'padrao';
  if (mode === 'padrao') return first;
  if (militia) return mode === 'paga' ? 'pagar' : 'recusar';
  if (mode === 'recusa') return first;
  const other = options.filter((x) => x !== first && d.costs[x]! <= s.cash).pop();
  return other ?? first;
}

/** Responde a todos os pedidos da semana. */
export function botDecide(state: GameState, o: BotOptions): GameState {
  let s = state;
  if (o.pocket) {
    const excess = s.cash - POCKET_KEEP;
    const min = o.pocket === 'offshore' ? pocket.offshore.min : 1;
    if (excess >= min) s = decide(s, { type: 'stash', to: o.pocket, amount: excess });
  }
  for (const d of state.dilemmas) {
    const option = d.kind === 'inquerito' ? inquiryOption(s, d, o) : incidentOption(s, d, o);
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

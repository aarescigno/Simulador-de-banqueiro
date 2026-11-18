import { describe, expect, it } from 'vitest';
import { escLines } from '../src/content/escLoans';
import { escLoans as P, esc as E } from '../src/content/params';
import {
  decide,
  deserialize,
  escHeadroom,
  executionQuote,
  generateEscRequests,
  newGame,
  serialize,
  type GameState,
  type Irregular,
  type LoanRequest,
} from '../src/engine';
import { createRng } from '../src/engine/rng';
import { SAVE_VERSION } from '../src/engine/state';
import { playBot } from '../sim/bot';

/** Estado do degrau 2 com a ESC aberta, caixa e capital sobrando. */
function escState(seed = 5): GameState {
  let s: GameState = { ...newGame(seed), week: 24, requests: [], loans: [], cash: 40_000 };
  s = decide(s, { type: 'launder', route: 'consultoria' });
  s.week = 30;
  s.laundering!.readyWeek = 30;
  s.laundering!.capital = E.capital;
  s = decide(s, { type: 'openEsc' });
  s.cash = 100_000;
  s.esc!.capital = 100_000;
  return s;
}

function irregulars(s: GameState, n = 400): LoanRequest[] {
  const out: LoanRequest[] = [];
  for (let i = 0; i < n; i++) {
    const rng = createRng(1000 + i);
    out.push(...generateEscRequests({ ...s, requests: [], loans: [], nextId: 1 }, rng));
  }
  return out.filter((r) => r.irregular);
}

describe('fichas irregulares', () => {
  const s = escState();
  const all = irregulars(s);
  const of = (k: Irregular) => all.filter((r) => r.irregular === k);

  it('sai uma fatia razoável de cada tipo', () => {
    expect(of('pf').length).toBeGreaterThan(0);
    expect(of('area').length).toBeGreaterThan(0);
    expect(of('media').length).toBeGreaterThan(0);
  });

  it('é determinístico por semente', () => {
    const a = generateEscRequests({ ...s, requests: [], nextId: 1 }, createRng(77));
    const b = generateEscRequests({ ...s, requests: [], nextId: 1 }, createRng(77));
    expect(a).toEqual(b);
  });

  it('pessoa física: sem CNPJ, valor pequeno, só veículo', () => {
    for (const r of of('pf')) {
      const c = r.company!;
      expect(c.porte).toBe('pf');
      expect(c.segment).toBe('Sem CNPJ');
      expect(c.revenue).toBe(0);
      expect(c.years).toBe(0);
      expect(c.name).toBe(r.debtor.name);
      expect(r.amount).toBeGreaterThanOrEqual(P.irregular.pf.amount[0]);
      expect(r.amount).toBeLessThanOrEqual(P.irregular.pf.amount[1]);
      expect(r.amount % 500).toBe(0);
      expect(r.assets.every((a) => a.kind === 'veiculo')).toBe(true);
      expect(r.reason).toBe('Abro um MEI amanhã, se precisar.');
    }
  });

  it('fora da área: cidade distante', () => {
    for (const r of of('area')) {
      expect(r.company!.cityKind).toBe('distante');
      expect(P.irregular.area.cities).toContain(r.company!.city);
    }
  });

  it('média empresa: valor e faturamento acima do porte', () => {
    for (const r of of('media')) {
      const c = r.company!;
      expect(c.porte).toBe('media');
      expect(r.amount).toBeGreaterThanOrEqual(P.irregular.media.amount[0]);
      expect(r.amount).toBeLessThanOrEqual(P.irregular.media.amount[1]);
      expect(c.revenue).toBeGreaterThanOrEqual(P.irregular.media.revenue[0]);
      expect(c.revenue % 5000).toBe(0);
      expect(r.assets.some((a) => a.kind === 'equipamento')).toBe(false);
    }
  });
});

function lendIrregular(s: GameState): { state: GameState; id: number } {
  let req: LoanRequest | undefined;
  for (let i = 0; i < 400 && !req; i++) {
    req = generateEscRequests({ ...s, requests: [], loans: [], nextId: 900 }, createRng(i)).find(
      (r) => r.irregular && r.amount <= escHeadroom(s),
    );
  }
  if (!req) throw new Error('sem ficha irregular');
  const t = { ...s, requests: [req] };
  // Taxa baixa: sempre cabe na tolerância.
  const state = decide(t, {
    type: 'accept',
    requestId: req.id,
    monthlyRate: 1,
    weeks: 8,
    collateral: null,
  });
  return { state, id: req.id };
}

describe('aceite e execução', () => {
  it('marca irregular, soma fio solto e registra o evento', () => {
    const s = escState();
    const { state, id } = lendIrregular(s);
    const loan = state.loans.find((l) => l.id === id);
    expect(loan).toBeTruthy();
    if (!loan) return;
    expect(loan.irregular).toBeTruthy();
    expect(state.esc!.loose).toBe(s.esc!.loose + 1);
    expect(state.queue.some((q) => q.event.type === 'looseThread')).toBe(true);
  });

  it('execução de contrato irregular devolve 0 e vem negada', () => {
    const s = escState();
    const { state, id } = lendIrregular(s);
    const loan = state.loans.find((l) => l.id === id);
    expect(loan).toBeTruthy();
    if (!loan) return;
    expect(executionQuote(loan)).toBe(0);
    loan.missedStreak = 2;
    const cash = state.cash;
    const after = decide(state, { type: 'execute', loanId: id });
    expect(after.cash).toBe(cash);
    const done = after.loans.find((l) => l.id === id)!;
    expect(done.status).toBe('defaulted');
    expect(done.recovered).toBe(0);
    const ex = after.queue.map((q) => q.event).find((e) => e.type === 'executed');
    expect(ex && ex.type === 'executed' && ex.denied).toBe(true);
  });
});

describe('textos', () => {
  it('linhas de fio solto e de execução negada', () => {
    const lines = escLines(
      [
        { type: 'looseThread', name: 'Pet Feliz', kind: 'pf' },
        { type: 'executed', name: 'Pet Feliz', recovered: 0, writtenOff: 900, collateral: null, denied: true },
      ],
      3,
    );
    expect(lines[0]).toBe(
      'Contrato com Pet Feliz registrado como capital de giro de outra empresa. O contador anotou.',
    );
    expect(lines[1]).toBe(
      'Pet Feliz: execução negada. Contrato fora do objeto da ESC. Baixado: R$ 900.',
    );
  });
});

describe('migração 9 → 10', () => {
  it('ESC ganha fios soltos', () => {
    const s = escState();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- save antigo, sem tipo
    const v9 = JSON.parse(serialize(s)) as Record<string, any>;
    v9.saveVersion = 9;
    delete v9.esc.loose;
    const m = deserialize(JSON.stringify(v9));
    expect(m.saveVersion).toBe(SAVE_VERSION);
    expect(m.esc!.loose).toBe(0);
  });
  it('sem ESC não muda nada', () => {
    const s = newGame(3);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- save antigo, sem tipo
    const v9 = JSON.parse(serialize(s)) as Record<string, any>;
    v9.saveVersion = 9;
    expect(deserialize(JSON.stringify(v9)).esc).toBeNull();
  });
});

describe('bot com irregulares', () => {
  it('não quebra nem estoura o limite', () => {
    const s = playBot(newGame(11), 60, {
      monthlyRate: 20,
      weeks: 8,
      esc: 'consultoria',
      escIrregular: true,
    });
    if (s.tier === 2) {
      expect(escHeadroom(s)).toBeGreaterThanOrEqual(-1);
      expect(s.esc!.loose).toBe(s.loans.filter((l) => l.irregular).length);
    }
  });
});

import { describe, expect, it } from 'vitest';
import { collateralText } from '../src/content/collateral';
import { cities, escReasons, porteLabel, segments } from '../src/content/companies';
import { escLines } from '../src/content/escLoans';
import { reportLines } from '../src/content/journal';
import { escLoans as P, esc as E, params } from '../src/content/params';
import { decide, newGame, step } from '../src/engine/game';
import {
  capitalize,
  collectEsc,
  distributable,
  distribute,
  escBook,
  escCanAccept,
  escHazard,
  escHeadroom,
  escLevelFor,
  escPayChance,
  executionQuote,
  generateEscRequests,
  principalLeft,
} from '../src/engine/escLoans';
import { createRng, type Rng } from '../src/engine/rng';
import type { LegalPorte, Collateral, GameEvent, GameState, Loan, LaunderRoute } from '../src/engine/state';
import { playBot } from '../sim/bot';

function fixedRng(x: number): Rng {
  return {
    next: () => x,
    int: (min) => min,
    chance: (p) => x < p,
    pick: (items) => items[0]!,
    state: () => 0,
  };
}
const NEVER = fixedRng(0.999);
const ALWAYS = fixedRng(0);

/** Partida já no degrau 2 (consultoria), semana 30, sem empréstimos. */
function tier2(seed = 1, route: LaunderRoute = 'consultoria'): GameState {
  let s: GameState = { ...newGame(seed), week: 24, requests: [], loans: [], cash: 40_000 };
  s = decide(s, { type: 'launder', route });
  s.week = 30;
  s.laundering!.readyWeek = 30;
  s.laundering!.capital = E.capital;
  return decide(s, { type: 'openEsc' });
}

const company = {
  name: 'Pão de Ouro',
  segment: 'Padaria',
  porte: 'micro' as const,
  city: cities.seat,
  cityKind: 'sede' as const,
  revenue: 10_000,
  years: 5,
  serasa: false,
};

function loan(over: Partial<Loan> = {}): Loan {
  return {
    id: 900,
    debtor: { name: 'Jorge Silva', short: 'Jorge', initials: 'JS', profession: 'Padaria' },
    reason: 'x',
    risk: 0.5,
    principal: 5_000,
    monthlyRate: 10,
    weeks: 12,
    installment: 500,
    totalDue: 6_000,
    startWeek: 24,
    paidInstallments: 2,
    totalPaid: 1_000,
    missedStreak: 0,
    broke: false,
    collateral: null,
    recovered: 0,
    override: null,
    lastLevel: null,
    status: 'active',
    company: { ...company },
    escLevel: null,
    ...over,
  };
}

describe('openEsc', () => {
  it('entra no degrau 2 com fichas, sem mexer no rngState e com o evento na fila', () => {
    let s: GameState = { ...newGame(5), week: 24, requests: [], loans: [], cash: 40_000 };
    s = decide(s, { type: 'launder', route: 'consultoria' });
    s.week = 30;
    s.laundering!.readyWeek = 30;
    s.laundering!.capital = E.capital;
    s.fear = 40;
    s.word = 70;
    s.incidents.mesada = 500;
    s.incidents.militia = 'paying';
    const before = s.rngState;
    const t = decide(s, { type: 'openEsc' });
    expect(t.tier).toBe(2);
    expect(t.rngState).toBe(before);
    expect(t.fear).toBe(0);
    expect(t.word).toBe(30);
    expect(t.incidents.mesada).toBe(0);
    expect(t.incidents.militia).toBe('none');
    expect(t.requests.length).toBeGreaterThanOrEqual(1);
    expect(t.requests.length).toBeLessThanOrEqual(5);
    for (const r of t.requests.filter((x) => !x.irregular)) {
      const c = r.company!;
      const pp = P.porte[c.porte as LegalPorte];
      expect(
        c.cityKind === 'sede' ? c.city === cities.seat : cities.neighbors.includes(c.city),
      ).toBe(true);
      expect(c.revenue).toBeGreaterThanOrEqual(pp.revenue[0]);
      expect(c.revenue).toBeLessThanOrEqual(pp.revenue[1]);
      expect(c.revenue % 500).toBe(0);
      expect(c.years).toBeGreaterThanOrEqual(0);
      expect(c.years).toBeLessThanOrEqual(12);
      expect(r.amount).toBeGreaterThanOrEqual(pp.amount[0]);
      expect(r.amount).toBeLessThanOrEqual(pp.amount[1]);
      expect(r.amount % 500).toBe(0);
    }
    const ev = t.queue.find((q) => q.event.type === 'escOpened');
    expect(ev).toBeTruthy();
  });
});

describe('generateEscRequests', () => {
  it('é determinístico, com risco na faixa e recebíveis = metade do faturamento', () => {
    const s = tier2(3);
    const a = generateEscRequests({ ...s, requests: [], nextId: 1 }, createRng(42));
    const b = generateEscRequests({ ...s, requests: [], nextId: 1 }, createRng(42));
    expect(a).toEqual(b);
    for (let seed = 1; seed <= 40; seed++) {
      for (const r of generateEscRequests({ ...s, requests: [], nextId: 1 }, createRng(seed))) {
        expect(r.risk).toBeGreaterThanOrEqual(0.02);
        expect(r.risk).toBeLessThanOrEqual(0.95);
        expect(r.maxRate).toBeGreaterThanOrEqual(1);
        const rec = r.assets.find((x) => x.kind === 'recebiveis');
        if (rec) expect(rec.value).toBe(Math.round((r.company!.revenue * 0.5) / 100) * 100);
        const v = r.assets.find((x) => x.kind === 'veiculo');
        if (v) {
          expect(v.value).toBeGreaterThanOrEqual(8_000);
          expect(v.value).toBeLessThanOrEqual(30_000);
        }
      }
    }
  });
});

describe('aceitar no degrau 2', () => {
  const withReq = (over: Record<string, unknown> = {}, cash = 25_000, capital = 25_000) => {
    const s = tier2(2);
    s.cash = cash;
    s.esc!.capital = capital;
    s.requests = [{ ...s.requests[0]!, amount: 3_000, maxRate: 8, patience: 1, ...over }];
    return s;
  };
  const id = (s: GameState) => s.requests[0]!.id;
  it('dentro do limite, ok; empréstimo copia a empresa e o evento usa o nome dela', () => {
    const s = withReq();
    const t = decide(s, { type: 'accept', requestId: id(s), monthlyRate: 6, weeks: 12 });
    expect(t.loans).toHaveLength(1);
    expect(t.loans[0]!.company).toEqual(s.requests[0]!.company);
    expect(t.cash).toBe(22_000);
    expect(t.word).toBeCloseTo(31);
    const e = t.queue.find((q) => q.event.type === 'loanMade')!.event as Extract<
      GameEvent,
      { type: 'loanMade' }
    >;
    expect(e.name).toBe(s.requests[0]!.company!.name);
  });
  it('acima do limite lança antes de acima do caixa', () => {
    const over = withReq({}, 1_000, 2_000);
    expect(() =>
      decide(over, { type: 'accept', requestId: id(over), monthlyRate: 6, weeks: 12 }),
    ).toThrow('Passa do limite de capital.');
    const poor = withReq({}, 1_000, 25_000);
    expect(() =>
      decide(poor, { type: 'accept', requestId: id(poor), monthlyRate: 6, weeks: 12 }),
    ).toThrow('Caixa insuficiente.');
  });
  it('termos fora de 1–30% e 4–52 semanas lançam erro', () => {
    const s = withReq();
    for (const [monthlyRate, weeks] of [
      [0, 12],
      [31, 12],
      [6, 3],
      [6, 53],
    ] as const) {
      expect(() => decide(s, { type: 'accept', requestId: id(s), monthlyRate, weeks })).toThrow();
    }
  });
  it('a contraproposta funciona como no degrau 1', () => {
    const s = withReq();
    const c = decide(s, { type: 'accept', requestId: id(s), monthlyRate: 20, weeks: 12 });
    expect(c.loans).toHaveLength(0);
    expect(c.requests[0]!.counter).toEqual({ rate: 8, collateral: null });
    expect(c.requests[0]!.patience).toBe(0);
    const out = decide(c, { type: 'accept', requestId: id(c), monthlyRate: 20, weeks: 12 });
    expect(out.requests).toHaveLength(0);
    expect(out.loans).toHaveLength(0);
  });
  it('garantia que o devedor não tem lança erro', () => {
    const s = withReq({ assets: [] });
    expect(() =>
      decide(s, {
        type: 'accept',
        requestId: id(s),
        monthlyRate: 6,
        weeks: 12,
        collateral: 'veiculo',
      }),
    ).toThrow('O devedor não tem essa garantia.');
  });
});

describe('limite de capital e lucro', () => {
  const montado = (cash: number) => {
    const s = tier2(1);
    s.esc!.capital = 25_000;
    s.cash = cash;
    s.pocket.laranja = 0;
    s.loans = [loan({ principal: 20_000, totalDue: 24_000, totalPaid: 6_000 })];
    return s;
  };
  it('contas exatas', () => {
    const s = montado(10_000);
    expect(principalLeft(s.loans[0]!)).toBe(15_000);
    expect(escBook(s)).toBe(15_000);
    expect(escHeadroom(s)).toBe(10_000);
    expect(distributable(s)).toBe(0);
    expect(
      escCanAccept({ ...s, requests: [{ ...tier2().requests[0]!, id: 7, amount: 10_000 }] }, 7),
    ).toBe(true);
    expect(
      escCanAccept({ ...s, requests: [{ ...tier2().requests[0]!, id: 7, amount: 10_500 }] }, 7),
    ).toBe(false);
  });
  it('distribuir ao laranja: 3.800 no bolso, 200 de taxa', () => {
    const s = montado(14_000);
    expect(distributable(s)).toBe(4_000);
    const t = decide(s, { type: 'distribute', to: 'laranja', amount: 4_000 });
    expect(t.pocket.laranja).toBe(3_800);
    expect(t.stats.fees - s.stats.fees).toBe(200);
    expect(t.stats.distributed).toBe(4_000);
    expect(t.cash).toBe(10_000);
    const ev = t.queue.find((q) => q.event.type === 'distributed')!.event;
    expect(ev).toMatchObject({ type: 'distributed', to: 'laranja', amount: 4_000, fee: 200 });
    expect(() => decide(s, { type: 'distribute', to: 'own', amount: 4_001 })).toThrow();
    expect(() => decide(s, { type: 'distribute', to: 'own', amount: 0 })).toThrow();
    expect(() => decide(s, { type: 'distribute', to: 'offshore', amount: 4_000 })).toThrow(
      'Remessa abaixo do mínimo.',
    );
  });
  it('distribuir só move dinheiro do caixa para o bolso e as taxas', () => {
    const s = montado(14_000);
    const total = (x: GameState) =>
      x.cash + x.pocket.own + x.pocket.laranja + x.pocket.offshore + x.stats.fees;
    for (const to of ['own', 'laranja'] as const) {
      expect(total(decide(s, { type: 'distribute', to, amount: 4_000 }))).toBe(total(s));
    }
  });
  it('capitalizar 4.000: capital 29.000 e limite 14.000', () => {
    const s = montado(14_000);
    const t = decide(s, { type: 'capitalize', amount: 4_000 });
    expect(t.esc!.capital).toBe(29_000);
    expect(escHeadroom(t)).toBe(14_000);
    expect(t.cash).toBe(14_000);
    expect(t.stats.distributed).toBe(0);
    expect(() => decide(t, { type: 'capitalize', amount: 1 })).toThrow();
    expect(capitalize(structuredClone(s), 100)).toMatchObject({
      type: 'capitalized',
      capital: 25_100,
    });
    expect(distribute(structuredClone(s), 'own', 100)).toMatchObject({
      type: 'distributed',
      fee: 0,
    });
  });
});

describe('pagamento, risco e política', () => {
  const veic: Collateral = { kind: 'veiculo', value: 10_000 };
  const rec: Collateral = { kind: 'recebiveis', value: 5_000 };
  it('valores exatos', () => {
    const l = loan({ collateral: veic });
    expect(escHazard(l)).toBeCloseTo(0.001 + 0.012 * 0.5 + 1.5 * 0.01);
    expect(escPayChance(l, 'serasa')).toBeCloseTo(0.97 - 0.15 - 0.08 + 0.05 + 0.12);
    expect(escPayChance(l, null)).toBeCloseTo(0.97 - 0.15 - 0.08 + 0.05);
    expect(escPayChance(l, 'aviso')).toBeCloseTo(0.97 - 0.15 - 0.08 + 0.05 + 0.06);
    expect(escPayChance(loan({ collateral: null }), null)).toBeCloseTo(0.97 - 0.15 - 0.08);
  });
  it('quebrado: recebíveis pagam 0,5 mais o passo; sem garantia, 0,05', () => {
    expect(escPayChance(loan({ broke: true, collateral: rec }), null)).toBeCloseTo(0.5);
    expect(escPayChance(loan({ broke: true, collateral: rec }), 'serasa')).toBeCloseTo(0.53);
    expect(escPayChance(loan({ broke: true, collateral: veic }), 'aviso')).toBeCloseTo(0.05);
    expect(escPayChance(loan({ broke: true }), null)).toBeCloseTo(0.05);
  });
  it('a política escolhe o passo certo', () => {
    const policy = { escCollection: { aviso: 1, serasa: 2, execucao: 4 } };
    const at = (n: number) => escLevelFor(policy, { missedStreak: n });
    expect([0, 1, 2, 3, 4, 5].map(at)).toEqual([
      null,
      'aviso',
      'serasa',
      'serasa',
      'execucao',
      'execucao',
    ]);
    expect(
      escLevelFor(
        { escCollection: { aviso: null, serasa: null, execucao: null } },
        { missedStreak: 5 },
      ),
    ).toBeNull();
  });
  it('com Serasa, a reputação perde 0,3', () => {
    const s = tier2(1);
    s.word = 30;
    const l = loan({ missedStreak: 2 });
    s.loans = [l];
    const events: GameEvent[] = [];
    collectEsc(s, s.loans[0]!, NEVER, events);
    expect(s.word).toBeCloseTo(29.7);
    expect(events[0]).toMatchObject({ type: 'missed', escLevel: 'serasa', streak: 3 });
    expect(s.loans[0]!.escLevel).toBe('serasa');
  });
  it('quem paga depois do passo vira evento com escLevel; quitar dá reputação', () => {
    const s = tier2(1);
    s.word = 30;
    s.loans = [
      loan({
        missedStreak: 1,
        weeks: 10,
        paidInstallments: 9,
        totalDue: 5_000,
        totalPaid: 4_500,
        startWeek: 20,
      }),
    ];
    const events: GameEvent[] = [];
    collectEsc(s, s.loans[0]!, ALWAYS, events);
    expect(events.map((e) => e.type)).toEqual(['paid', 'settled']);
    expect(events[0]).toMatchObject({ escLevel: 'aviso', amount: 500, name: 'Pão de Ouro' });
    expect(s.word).toBeCloseTo(31);
    expect(s.loans[0]!.status).toBe('paid');
  });
});

describe('execução', () => {
  it('pela política, no limiar: veículo retoma, recebíveis penhoram', () => {
    const s = tier2(1);
    s.word = 30;
    const veic: Collateral = { kind: 'veiculo', value: 10_000 };
    s.loans = [loan({ missedStreak: 4, collateral: veic })];
    const cash = s.cash;
    const events: GameEvent[] = [];
    collectEsc(s, s.loans[0]!, ALWAYS, events);
    const owed = 5_000;
    const recovered = Math.round(Math.min(owed, 10_000 * 0.3) * 0.8);
    expect(recovered).toBe(2_400);
    const l = s.loans[0]!;
    expect(l.status).toBe('defaulted');
    expect(l.endWeek).toBe(s.week);
    expect(l.recovered).toBe(recovered);
    expect(s.cash).toBe(cash + recovered);
    expect(s.stats.recovered).toBe(recovered);
    expect(s.stats.writtenOff).toBe(owed - recovered);
    expect(s.word).toBeCloseTo(28);
    expect(events).toEqual([
      {
        type: 'executed',
        name: 'Pão de Ouro',
        recovered,
        writtenOff: owed - recovered,
        collateral: 'veiculo',
      },
    ]);

    const r = tier2(1);
    r.loans = [loan({ missedStreak: 4, collateral: { kind: 'recebiveis', value: 5_000 } })];
    const ev: GameEvent[] = [];
    collectEsc(r, r.loans[0]!, ALWAYS, ev);
    expect(r.loans[0]!.recovered).toBe(Math.round(5_000 * 0.1 * 0.8));
    expect(ev[0]).toMatchObject({ type: 'executed', collateral: null, recovered: 400 });
  });
  it('sem execução na política, vira calote depois de 6 semanas, sem recuperar nada', () => {
    const s = tier2(1);
    s.word = 30;
    s.policy.escCollection = { aviso: 1, serasa: 2, execucao: null };
    s.loans = [loan({ missedStreak: 5, collateral: { kind: 'veiculo', value: 10_000 } })];
    const events: GameEvent[] = [];
    collectEsc(s, s.loans[0]!, NEVER, events);
    const l = s.loans[0]!;
    expect(l.status).toBe('defaulted');
    expect(l.recovered).toBe(0);
    expect(s.stats.writtenOff).toBe(5_000);
    expect(s.word).toBeLessThan(30);
    expect(events).toEqual([
      { type: 'defaulted', name: 'Pão de Ouro', writtenOff: 5_000, recovered: 0, collateral: null },
    ]);
  });
  it('a decisão execute: só ativo e atrasado; igual ao quote', () => {
    const s = tier2(1);
    s.word = 30;
    s.loans = [loan({ missedStreak: 1, collateral: { kind: 'veiculo', value: 10_000 } })];
    const quote = executionQuote(s.loans[0]!);
    const t = decide(s, { type: 'execute', loanId: 900 });
    expect(t.loans[0]!.recovered).toBe(quote);
    expect(t.loans[0]!.status).toBe('defaulted');
    expect(t.cash).toBe(s.cash + quote);
    expect(() => decide(t, { type: 'execute', loanId: 900 })).toThrow();
    expect(() => decide(s, { type: 'execute', loanId: 1234 })).toThrow();
    const ok = tier2(1);
    ok.loans = [loan({ missedStreak: 0 })];
    expect(() => decide(ok, { type: 'execute', loanId: 900 })).toThrow();
  });
  it('setEscPolicy valida os limiares', () => {
    const s = tier2(1);
    const t = decide(s, {
      type: 'setEscPolicy',
      collection: { aviso: 2, serasa: null, execucao: 5 },
    });
    expect(t.policy.escCollection).toEqual({ aviso: 2, serasa: null, execucao: 5 });
    expect(t.policy.collection).toEqual(s.policy.collection);
    expect(() =>
      decide(s, { type: 'setEscPolicy', collection: { aviso: 6, serasa: 1, execucao: 1 } }),
    ).toThrow();
  });
});

describe('guardas por degrau', () => {
  it('as sete decisões do caderninho lançam erro no degrau 2, e as quatro da ESC no degrau 1', () => {
    const s = tier2(1);
    const old = [
      { type: 'setPolicy', collection: { conversa: 1, pressao: 2, primo: 4 } },
      { type: 'setOverride', loanId: 1, override: null },
      { type: 'forgive', loanId: 1 },
      { type: 'stash', to: 'own', amount: 1 },
      { type: 'unstash', from: 'own', amount: 1 },
      { type: 'launder', route: 'consultoria' },
      { type: 'openEsc' },
    ] as const;
    for (const d of old) expect(() => decide(s, d)).toThrow('Isso é do caderninho.');
    const one = newGame(1);
    const news = [
      { type: 'setEscPolicy', collection: { aviso: 1, serasa: 2, execucao: 4 } },
      { type: 'execute', loanId: 1 },
      { type: 'distribute', to: 'own', amount: 1 },
      { type: 'capitalize', amount: 1 },
    ] as const;
    for (const d of news) expect(() => decide(one, d)).toThrow('Isso é da ESC.');
  });
});

describe('step no degrau 2', () => {
  it('30 semanas: sem ocorrência, inquérito, denúncia ou crise; calor só cai; medo 0; bloqueio vence', () => {
    const banned = new Set([
      'incident',
      'incidentChoice',
      'inquiryOpened',
      'raid',
      'crisisOpened',
      'crisisEnded',
      'complaint',
      'heatRose',
      'bribed',
      'militiaCut',
      'mesadaFailed',
    ]);
    for (let seed = 1; seed <= 10; seed++) {
      let s = tier2(seed);
      s.police.heat = 80;
      s.pocket.blocked = 5_000;
      s.pocket.blockedUntil = s.week + 3;
      let sawUnblocked = false;
      for (let i = 0; i < 30; i++) {
        const heat = s.police.heat;
        const res = step(s);
        s = res.state;
        for (const e of res.events) {
          expect(banned.has(e.type)).toBe(false);
          if (e.type === 'unblocked') sawUnblocked = true;
        }
        expect(s.police.heat).toBeLessThanOrEqual(heat);
        expect(s.fear).toBe(0);
        expect(s.police.inquiry).toBeNull();
        expect(s.crisis).toBeNull();
      }
      expect(sawUnblocked).toBe(true);
      expect(s.pocket.blocked).toBe(0);
      expect(s.requests.length).toBeGreaterThanOrEqual(1);
    }
  });
  it('retire no degrau 2: aposentado com caixa e bolso', () => {
    const s = tier2(1);
    s.cash = 12_000;
    s.pocket.own = 3_000;
    const t = decide(s, { type: 'retire' });
    expect(t.ended!.kind).toBe('aposentado');
    expect(t.ended!.score).toBe(15_000 + s.pocket.laranja + s.pocket.offshore);
  });
  it('o Jornal mostra pedidos que expiram com o nome da empresa', () => {
    const s = tier2(1);
    const name = s.requests[0]!.company!.name;
    const { events } = step(s);
    expect(events).toContainEqual({ type: 'expired', name });
  });
});

describe('bot na ESC', () => {
  it.each<LaunderRoute>(['consultoria', 'fachada', 'laranja', 'devagar'])(
    'rota %s: 20 sementes, 70 semanas, o limite de capital nunca estoura',
    (route) => {
      for (let seed = 1; seed <= 20; seed++) {
        const s = playBot(newGame(seed), 70, { monthlyRate: 20, weeks: 8, esc: route });
        if (s.tier !== 2) continue;
        expect(escBook(s)).toBeLessThanOrEqual(s.esc!.capital);
        expect(s.cash).toBeGreaterThanOrEqual(0);
        expect(s.stats.distributed).toBeGreaterThanOrEqual(0);
      }
    },
    30_000,
  );
});

describe('textos', () => {
  it('cada segmento tem rótulo, nomes e chances; cada motivo tem texto', () => {
    expect(segments.length).toBe(10);
    for (const seg of segments) {
      expect(seg.label).toBeTruthy();
      expect(seg.names.length).toBeGreaterThanOrEqual(2);
      for (const k of ['veiculo', 'equipamento', 'recebiveis'] as const) {
        expect(seg[k]).toBeGreaterThanOrEqual(0);
        expect(seg[k]).toBeLessThanOrEqual(1);
      }
    }
    expect(escReasons).toHaveLength(12);
    for (const r of escReasons) expect(r.text).toBeTruthy();
    expect(Object.keys(porteLabel)).toEqual(['mei', 'micro', 'pequena', 'pf', 'media']);
  });
  it('escLines cobre escOpened, executed, distributed e capitalized', () => {
    const lines = escLines(
      [
        { type: 'escOpened', route: 'consultoria', capital: 25_000, who: 'Wesley' },
        {
          type: 'executed',
          name: 'Pão de Ouro',
          recovered: 2_400,
          writtenOff: 2_600,
          collateral: 'veiculo',
        },
        {
          type: 'executed',
          name: 'Pet Feliz',
          recovered: 400,
          writtenOff: 4_600,
          collateral: null,
        },
        { type: 'distributed', to: 'laranja', amount: 4_000, fee: 200, who: 'Wesley' },
        { type: 'distributed', to: 'own', amount: 1_000, fee: 0, who: 'Wesley' },
        { type: 'distributed', to: 'offshore', amount: 5_000, fee: 500, who: 'Wesley' },
        { type: 'capitalized', amount: 4_000, capital: 29_000 },
        { type: 'paid', name: 'A', amount: 100, escLevel: 'aviso' },
        { type: 'paid', name: 'B', amount: 100, escLevel: 'serasa' },
        { type: 'missed', name: 'C', streak: 2, escLevel: 'serasa' },
      ],
      30,
    );
    expect(lines.join('\n')).toContain('Semana 30');
    expect(lines.join('\n')).toContain('Veículo retomado e leiloado: R$');
    expect(lines.join('\n')).toContain('Penhora:');
    expect(lines.join('\n')).toContain('em seu nome');
    expect(lines.join('\n')).toContain('no nome de Wesley, menos');
    expect(lines.join('\n')).toContain('lá fora, menos');
    expect(lines.join('\n')).toContain('Capital declarado sobe para');
    expect(lines.join('\n')).toContain('A pagou depois da ligação do escritório.');
    expect(lines.join('\n')).toContain('B pagou para limpar o nome.');
    expect(lines.join('\n')).toContain('C não pagou. Nome no Serasa.');
  });
  it('o Jornal não repete pagamento comum para quem pagou depois de um passo', () => {
    const lines = reportLines({
      week: 31,
      events: [
        { type: 'paid', name: 'A', amount: 100, escLevel: 'aviso' },
        { type: 'paid', name: 'B', amount: 50, escLevel: null },
      ],
      cash: 1_000,
      fear: 0,
      word: 30,
      heat: 0,
    });
    expect(lines.filter((l) => l.includes('Recebido'))).toHaveLength(2);
    expect(lines.some((l) => l.startsWith('B pagou.'))).toBe(true);
    expect(lines.some((l) => l.startsWith('A pagou depois da ligação'))).toBe(true);
  });
  it('collateralText tem as seis garantias', () => {
    expect(Object.keys(collateralText).sort()).toEqual(
      ['celular', 'equipamento', 'inss', 'moto', 'recebiveis', 'veiculo'].sort(),
    );
    expect(params.collateral.veiculo.recovery).toBe(0.3);
  });
});

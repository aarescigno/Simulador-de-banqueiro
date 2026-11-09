import { describe, expect, it } from 'vitest';
import { dilemmaTexts, incidentNames, newsTexts } from '../src/content/incidents';
import { reportLines } from '../src/content/journal';
import { incidents as P, params, police } from '../src/content/params';
import { generateRequests, levelFor, makeLoan, payChance, shockDelta } from '../src/engine/agiota';
import { decide, newGame, step } from '../src/engine/game';
import {
  allIncidents,
  defaultOption,
  devForceIncident,
  dilemmaOptions,
  drawable,
  eligibleIncidents,
  followUps,
  isDilemma,
  resolveDefaults,
  startIncident,
  tickIncidents,
} from '../src/engine/incidents';
import { tickPolice } from '../src/engine/police';
import { createRng, type Rng } from '../src/engine/rng';
import { deserialize, serialize } from '../src/engine/save';
import type { GameEvent, GameState, IncidentId, Loan } from '../src/engine/state';
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

/** Partida na semana dada, sem pedidos, com R$ 20 mil e um empréstimo ativo. */
function base(week = 10): { s: GameState; loan: Loan } {
  const s = newGame(1);
  const loan = makeLoan(s, s.requests[0]!, { monthlyRate: 20, weeks: 8, collateral: null });
  loan.startWeek = 1;
  return { s: { ...s, week, requests: [], loans: [loan] }, loan };
}

const ids = (s: GameState) => eligibleIncidents(s).map((e) => e.id);

/** Abre a ocorrência e responde com a opção; devolve o estado e o evento da escolha. */
function choose(s: GameState, id: IncidentId, option: string, loan?: Loan) {
  const open = structuredClone(s);
  startIncident(open, id, loan && open.loans.find((l) => l.id === loan.id), NEVER, [], open.week);
  const d = open.dilemmas.find((x) => x.kind === id)!;
  const after = decide(open, { type: 'choose', dilemmaId: d.id, option });
  return { after, event: after.queue[after.queue.length - 1]!.event };
}

describe('elegibilidade', () => {
  it('gatilho: delegado pede atenção média e nenhuma mesada', () => {
    const { s } = base(10);
    expect(ids(s)).not.toContain('delegado');
    s.police.heat = 25;
    expect(ids(s)).toContain('delegado');
    s.incidents.mesada = 600;
    expect(ids(s)).not.toContain('delegado');
  });

  it('semana mínima', () => {
    const { s } = base(5);
    s.police.heat = 25;
    expect(ids(s)).not.toContain('delegado');
    expect(ids({ ...s, week: 6 })).toContain('delegado');
    expect(ids({ ...s, week: 19 })).not.toContain('decimo');
    expect(ids({ ...s, week: 20 })).toContain('decimo');
  });

  it('intervalo de repetição, contado da última vez', () => {
    const { s } = base(20);
    s.police.heat = 25;
    s.incidents.last.delegado = 20 - P.delegado.cooldown! + 1;
    expect(ids(s)).not.toContain('delegado');
    s.incidents.last.delegado = 20 - P.delegado.cooldown!;
    expect(ids(s)).toContain('delegado');
  });

  it('uma vez só: milícia e décimo terceiro', () => {
    const { s } = base(40);
    s.stats.received = P.milicia.minReceived;
    expect(ids(s)).toContain('milicia');
    s.incidents.last.milicia = 8;
    s.incidents.last.decimo = 20;
    expect(ids(s)).not.toContain('milicia');
    expect(ids(s)).not.toContain('decimo');
  });

  it('milícia pede recebido mínimo e estado limpo', () => {
    const { s } = base(10);
    s.stats.received = P.milicia.minReceived - 1;
    expect(ids(s)).not.toContain('milicia');
    s.stats.received = P.milicia.minReceived;
    s.incidents.militia = 'paying';
    expect(ids(s)).not.toContain('milicia');
  });

  it('um dilema de ocorrência por vez; notícia passa; inquérito não bloqueia', () => {
    const { s } = base(30);
    s.cash = 50_000;
    s.police.heat = 25;
    expect(ids(s)).toContain('pastor');
    expect(ids(s)).toContain('assalto');
    s.dilemmas.push({ id: 90, kind: 'inquerito', week: 30, costs: { correr: 0 } });
    expect(ids(s)).toContain('pastor');
    s.dilemmas.push({ id: 91, kind: 'pastor', week: 30, costs: { recusar: 0, dar: 1000 } });
    const after = ids(s);
    expect(after).toContain('assalto');
    expect(after.filter((id) => isDilemma(id))).toEqual([]);
  });

  it('gatilhos dos que miram devedor', () => {
    const { s, loan } = base(30);
    expect(ids(s)).not.toContain('rolar');
    loan.missedStreak = 2;
    expect(ids(s)).toContain('rolar');
    expect(ids(s)).not.toContain('bem');
    loan.missedStreak = 3;
    expect(ids(s)).toContain('bem');
    expect(ids(s)).not.toContain('tragedia');
    loan.lastLevel = 'pressao';
    expect(ids(s)).toContain('tragedia');
    loan.lastLevel = 'conversa';
    expect(ids(s)).not.toContain('tragedia');
    loan.risk = 0.4;
    expect(ids(s)).not.toContain('some');
    loan.risk = 0.5;
    expect(ids(s)).toContain('some');
    expect(ids(s)).not.toContain('cartao');
    loan.collateral = { kind: 'inss', value: 2000 };
    expect(ids(s)).toContain('cartao');
    loan.status = 'paid';
    expect(ids(s)).not.toContain('cartao');
  });

  it('outros gatilhos: rival, rádio, fiança, assalto', () => {
    const { s, loan } = base(30);
    expect(ids(s)).toContain('rival');
    s.incidents.rivalUntil = 40;
    expect(ids(s)).not.toContain('rival');
    s.police.heat = 25;
    expect(ids(s)).not.toContain('radio');
    s.complaints = 2;
    expect(ids(s)).toContain('radio');
    expect(ids(s)).not.toContain('fianca');
    loan.lastLevel = 'primo';
    expect(ids(s)).toContain('fianca');
    s.cash = P.assalto.minCash - 1;
    expect(ids(s)).not.toContain('assalto');
    s.cash = P.assalto.minCash;
    expect(ids(s)).toContain('assalto');
  });

  it('devedor com dilema pendente não é alvo de outro', () => {
    const { s, loan } = base(30);
    loan.missedStreak = 3;
    s.dilemmas.push({ id: 90, kind: 'rolar', week: 30, loanId: loan.id, costs: { recusar: 0 } });
    expect(ids(s)).not.toContain('bem');
  });

  it('as 16 sorteáveis mais as 3 de seguimento dão 19, todas com nome', () => {
    expect(drawable).toHaveLength(16);
    expect(followUps).toHaveLength(3);
    expect(allIncidents).toHaveLength(19);
    for (const id of allIncidents) expect(incidentNames[id]).toBeTruthy();
  });
});

describe('sorteio semanal', () => {
  it('sem chance, nada acontece; com chance, uma ocorrência', () => {
    const { s } = base(30);
    s.cash = 50_000;
    const none: GameEvent[] = [];
    tickIncidents(s, NEVER, none);
    expect(none.filter((e) => e.type === 'incident')).toEqual([]);
    const some: GameEvent[] = [];
    tickIncidents(s, fixedRng(0), some);
    expect(some.filter((e) => e.type === 'incident')).toHaveLength(1);
    expect(Object.keys(s.incidents.last)).toHaveLength(1);
  });

  it('dilema entra pendente para a semana seguinte; notícia sai na hora', () => {
    const { s } = base(30);
    const ev: GameEvent[] = [];
    startIncident(s, 'pastor', undefined, NEVER, ev, s.week + 1);
    expect(s.dilemmas[0]).toMatchObject({ kind: 'pastor', week: 31, costs: { dar: 1000 } });
    expect(ev).toEqual([{ type: 'incident', id: 'pastor', name: undefined, amount: undefined }]);
    startIncident(s, 'gas', undefined, NEVER, ev, s.week + 1);
    expect(s.dilemmas).toHaveLength(1);
    expect(s.incidents.shock.payDelta).toBe(P.gas.payDelta);
  });
});

describe('opções dos dilemas', () => {
  it('delegado', () => {
    const { s } = base();
    s.police.heat = 30;
    const a = choose(s, 'delegado', 'recusar').after;
    expect(a.police.heat).toBe(30 + P.delegado.heatRefuse);
    expect(a.incidents.mesada).toBe(0);
    const b = choose(s, 'delegado', 'mesada').after;
    expect(b.police.heat).toBe(30 + P.delegado.heatMesada);
    expect(b.incidents.mesada).toBe(600);
    expect(b.cash).toBe(s.cash);
  });

  it('milícia', () => {
    const { s } = base(10);
    s.fear = 10;
    const a = choose(s, 'milicia', 'pagar').after;
    expect(a.incidents).toMatchObject({ militia: 'paying', militiaRate: 0.1 });
    expect(a.fear).toBe(15);
    const b = choose(s, 'milicia', 'recusar').after;
    expect(b.incidents.militia).toBe('refused');
    expect(b.incidents.scheduled).toEqual([{ week: 13, id: 'milicia_recado' }]);
    expect(b.fear).toBe(10);
  });

  it('recado da milícia', () => {
    const { s } = base(14);
    s.fear = 40;
    const a = choose(s, 'milicia_recado', 'pagar').after;
    expect(a.incidents).toMatchObject({ militia: 'paying', militiaRate: 0.15 });
    const b = choose(s, 'milicia_recado', 'recusar');
    expect(b.after.cash).toBe(12_000);
    expect(b.after.stats.spent).toBe(8_000);
    expect(b.after.fear).toBe(20);
    expect(b.after.incidents.militia).toBe('refusedTwice');
    expect(b.after.incidents.primoOutUntil).toBe(14 + 1 + 6);
    expect(b.event).toMatchObject({ type: 'incidentChoice', amount: 8_000 });
  });

  it('rival', () => {
    const { s } = base(10);
    s.police.heat = 10;
    s.fear = 0;
    const a = choose(s, 'rival', 'ignorar').after;
    expect(a.incidents.rivalUntil).toBe(10 + 1 + 8);
    const b = choose(s, 'rival', 'primo').after;
    expect(b.incidents.rivalUntil).toBe(0);
    expect(b.police.heat).toBe(25);
    expect(b.fear).toBe(5);
  });

  it('rival: sem a opção do primo se o primo está fora', () => {
    const { s } = base(10);
    s.incidents.primoOutUntil = 20;
    const open = structuredClone(s);
    startIncident(open, 'rival', undefined, NEVER, [], 11);
    expect(Object.keys(open.dilemmas[0]!.costs)).toEqual(['ignorar']);
    expect(() =>
      decide(open, { type: 'choose', dilemmaId: open.dilemmas[0]!.id, option: 'primo' }),
    ).toThrow();
  });

  it('rolar: parcelas atrasadas contam como pagas, com dinheiro do jogador', () => {
    const { s, loan } = base(5);
    loan.missedStreak = 2;
    const i = loan.installment;
    const due = loan.totalDue;
    const { after, event } = choose(s, 'rolar', 'rolar', loan);
    const l = after.loans[0]!;
    expect(l.paidInstallments).toBe(2);
    expect(l.totalPaid).toBe(2 * i);
    expect(l.weeks).toBe(11);
    expect(l.totalDue).toBe(due + 3 * i);
    expect(l.missedStreak).toBe(0);
    expect(after.cash).toBe(s.cash);
    expect(after.stats.lent).toBe(s.stats.lent + 2 * i);
    expect(after.stats.received).toBe(s.stats.received + 2 * i);
    expect(event).toMatchObject({ type: 'incidentChoice', option: 'rolar', amount: 2 * i });
    expect(choose(s, 'rolar', 'recusar', loan).after.loans[0]).toEqual(loan);
  });

  it('bem: fecha como calote recuperando 25% do saldo', () => {
    const { s, loan } = base(10);
    loan.missedStreak = 3;
    loan.totalPaid = 500;
    const saldo = loan.totalDue - 500;
    const got = Math.round(0.25 * saldo);
    s.fear = 0;
    s.word = 30;
    const { after } = choose(s, 'bem', 'aceitar', loan);
    const l = after.loans[0]!;
    expect(l.status).toBe('defaulted');
    expect(l.recovered).toBe(got);
    expect(after.cash).toBe(s.cash + got);
    expect(after.stats.recovered).toBe(got);
    expect(after.stats.writtenOff).toBe(saldo - got);
    expect(after.fear).toBe(1);
    expect(after.word).toBe(28);
    expect(choose(s, 'bem', 'recusar', loan).after.loans[0]!.status).toBe('active');
  });

  it('pastor', () => {
    const { s } = base();
    s.word = 30;
    s.police.heat = 10;
    const a = choose(s, 'pastor', 'recusar').after;
    expect(a.word).toBe(28);
    expect(a.cash).toBe(s.cash);
    const b = choose(s, 'pastor', 'dar').after;
    expect(b.cash).toBe(s.cash - 1000);
    expect(b.word).toBe(36);
    expect(b.police.heat).toBe(5);
    expect(b.stats.spent).toBe(1000);
  });

  it('vereador: empresta, agenda a devolução e reduz o inquérito', () => {
    const { s } = base(12);
    expect(choose(s, 'vereador', 'recusar').after.cash).toBe(s.cash);
    const a = choose(s, 'vereador', 'emprestar').after;
    expect(a.cash).toBe(s.cash - 5000);
    expect(a.incidents.vereadorUntil).toBe(12 + 1 + 20);
    expect(a.incidents.scheduled).toEqual([{ week: 32, id: 'vereador_paga' }]);
  });

  it('rádio', () => {
    const { s } = base();
    s.word = 30;
    s.police.heat = 30;
    const a = choose(s, 'radio', 'ignorar').after;
    expect(a.police.heat).toBe(38);
    expect(a.word).toBe(25);
    const b = choose(s, 'radio', 'pagar').after;
    expect(b.police.heat).toBe(22);
    expect(b.cash).toBe(s.cash - 1500);
  });

  it('fiança', () => {
    const { s } = base(10);
    s.police.heat = 10;
    const a = choose(s, 'fianca', 'deixar').after;
    expect(a.incidents.primoOutUntil).toBe(17);
    expect(a.police.heat).toBe(25);
    const b = choose(s, 'fianca', 'pagar').after;
    expect(b.cash).toBe(s.cash - 2000);
    expect(b.incidents.primoOutUntil).toBe(0);
  });

  it('PM', () => {
    const { s } = base(10);
    s.police.heat = 20;
    const a = choose(s, 'pm', 'recusar').after;
    expect(a.police.heat).toBe(25);
    const b = choose(s, 'pm', 'emprestar').after;
    expect(b.police.heat).toBe(8);
    expect(b.cash).toBe(s.cash - 3000);
    expect(b.incidents.scheduled).toEqual([{ week: 20, id: 'pm_paga' }]);
  });

  it('opção sem caixa ou inexistente lança erro', () => {
    const { s } = base(12);
    s.cash = 4000;
    const open = structuredClone(s);
    startIncident(open, 'vereador', undefined, NEVER, [], 13);
    const id = open.dilemmas[0]!.id;
    expect(() => decide(open, { type: 'choose', dilemmaId: id, option: 'emprestar' })).toThrow();
    expect(() => decide(open, { type: 'choose', dilemmaId: id, option: 'toString' })).toThrow();
  });

  it('a atenção fica entre 0 e 100', () => {
    const { s } = base();
    s.police.heat = 98;
    expect(choose(s, 'delegado', 'recusar').after.police.heat).toBe(100);
    s.police.heat = 3;
    expect(choose(s, 'delegado', 'mesada').after.police.heat).toBe(0);
  });
});

describe('sem resposta, vale a opção padrão', () => {
  it('a primeira opção da tabela é a padrão', () => {
    expect(defaultOption('inquerito')).toBe('correr');
    expect(defaultOption('milicia')).toBe('pagar');
    expect(defaultOption('delegado')).toBe('recusar');
  });

  it('resolveDefaults aplica a de cada dilema pendente', () => {
    const { s } = base(10);
    s.police.heat = 10;
    const ev: GameEvent[] = [];
    startIncident(s, 'delegado', undefined, NEVER, ev, 10);
    startIncident(s, 'milicia', undefined, NEVER, ev, 10);
    resolveDefaults(s, ev);
    expect(s.dilemmas).toEqual([]);
    expect(s.police.heat).toBe(20);
    expect(s.incidents.militia).toBe('paying');
    expect(ev.filter((e) => e.type === 'incidentChoice')).toHaveLength(2);
  });

  it('o step aplica a padrão e o Jornal conta', () => {
    const { s } = base(10);
    const open = structuredClone(s);
    startIncident(open, 'milicia', undefined, NEVER, [], 10);
    const r = step(open, [], createRng(1));
    expect(r.state.incidents.militia).toBe('paying');
    expect(r.state.dilemmas.some((d) => d.kind === 'milicia')).toBe(false);
    expect(r.events.some((e) => e.type === 'incidentChoice' && e.id === 'milicia')).toBe(true);
  });
});

describe('efeitos contínuos', () => {
  it('mesada sai do caixa toda semana', () => {
    const { s } = base();
    s.incidents.mesada = 600;
    s.cash = 2000;
    const ev: GameEvent[] = [];
    tickIncidents(s, NEVER, ev);
    expect(s.cash).toBe(1400);
    expect(s.stats.spent).toBe(600);
    expect(s.incidents.mesada).toBe(600);
  });

  it('mesada falha sem caixa: para, atenção +15 e o Jornal avisa', () => {
    const { s } = base();
    s.incidents.mesada = 600;
    s.cash = 500;
    s.police.heat = 10;
    const ev: GameEvent[] = [];
    tickIncidents(s, NEVER, ev);
    expect(s.cash).toBe(500);
    expect(s.incidents.mesada).toBe(0);
    expect(s.police.heat).toBe(25);
    expect(ev).toEqual([{ type: 'mesadaFailed' }]);
    expect(
      reportLines({ week: 1, cash: 0, fear: 0, word: 0, heat: 0, events: ev }).join(' '),
    ).toContain('mesada atrasou');
  });

  it('milícia leva a taxa sobre o que entrou de parcelas na semana', () => {
    const { s } = base();
    s.incidents.militia = 'paying';
    s.incidents.militiaRate = 0.1;
    s.cash = 5000;
    const ev: GameEvent[] = [
      { type: 'paid', name: 'A', amount: 600 },
      { type: 'paid', name: 'B', amount: 400 },
    ];
    tickIncidents(s, NEVER, ev);
    expect(s.cash).toBe(4900);
    expect(s.stats.spent).toBe(100);
    expect(ev[ev.length - 1]).toEqual({ type: 'militiaCut', amount: 100 });
    // Sem parcela recebida, não leva nada.
    const { s: t } = base();
    t.incidents.militia = 'paying';
    t.incidents.militiaRate = 0.15;
    const none: GameEvent[] = [];
    tickIncidents(t, NEVER, none);
    expect(none).toEqual([]);
  });

  it('recado agendado para 3 semanas depois abre o dilema', () => {
    const { s } = base(8);
    s.stats.received = 20_000;
    const refused = choose(s, 'milicia', 'recusar').after;
    expect(refused.incidents.scheduled).toEqual([{ week: 11, id: 'milicia_recado' }]);
    const t = { ...refused, week: 10 };
    tickIncidents(t, NEVER, []);
    expect(t.dilemmas).toEqual([]);
    const u = { ...refused, week: 11 };
    tickIncidents(u, NEVER, []);
    expect(u.dilemmas[0]).toMatchObject({ kind: 'milicia_recado', week: 12 });
    expect(u.incidents.scheduled).toEqual([]);
  });

  it('rival tira 1 pedido por semana e baixa a taxa máxima (média em 200 sementes)', () => {
    const { s } = base(12);
    const rivalState = { ...s, incidents: { ...s.incidents, rivalUntil: 20 } };
    let n0 = 0;
    let n1 = 0;
    let r0 = 0;
    let r1 = 0;
    for (let seed = 1; seed <= 200; seed++) {
      const a = generateRequests(s, createRng(seed));
      const b = generateRequests(rivalState, createRng(seed));
      n0 += a.length;
      n1 += b.length;
      r0 += a.reduce((x, r) => x + r.maxRate, 0);
      r1 += b.reduce((x, r) => x + r.maxRate, 0);
    }
    expect((n0 - n1) / 200).toBeGreaterThan(0.8);
    expect((n0 - n1) / 200).toBeLessThanOrEqual(1);
    // Média por pedido: pedidos a menos puxam a soma, então compara médias.
    expect(r0 / n0 - r1 / n1).toBeGreaterThan(6);
    expect(r0 / n0 - r1 / n1).toBeLessThan(10);
    expect(generateRequests({ ...rivalState, week: 20 }, createRng(1)).length).toBe(
      generateRequests(s, createRng(1)).length,
    );
  });

  it('primo fora vira pressão onde a regra ou a exceção pede o primo', () => {
    const policy = { collection: { conversa: 1, pressao: 2, primo: 4 } };
    expect(levelFor(policy, { missedStreak: 4, override: null })).toBe('primo');
    expect(levelFor(policy, { missedStreak: 4, override: null }, true)).toBe('pressao');
    expect(levelFor(policy, { missedStreak: 1, override: 'primo' }, true)).toBe('pressao');
    expect(levelFor(policy, { missedStreak: 1, override: null }, true)).toBe('conversa');
    expect(levelFor(policy, { missedStreak: 0, override: 'primo' }, true)).toBeNull();
  });

  it('primo fora vale na cobrança do step', () => {
    const { s, loan } = base(5);
    loan.missedStreak = 4;
    s.policy.collection = { conversa: 1, pressao: 2, primo: 4 };
    const out = structuredClone(s);
    out.incidents.primoOutUntil = 9;
    step(out, [], fixedRng(0.999));
    const after = step(out, [], fixedRng(0.999)).state.loans[0]!;
    expect(after.lastLevel).toBe('pressao');
    expect(step(s, [], fixedRng(0.999)).state.loans[0]!.lastLevel).toBe('primo');
  });

  it('choque mexe na chance de pagar de quem não quebrou', () => {
    const { loan } = base();
    const normal = payChance(loan);
    expect(payChance(loan, { shock: -0.06 })).toBeCloseTo(normal - 0.06);
    expect(payChance(loan, { shock: 0.08 })).toBeCloseTo(normal + 0.08);
    const broke = { ...loan, broke: true };
    expect(payChance(broke, { shock: 0.08 })).toBe(payChance(broke));
    const { s } = base(10);
    s.incidents.shock = { until: 12, payDelta: -0.06 };
    expect(shockDelta(s)).toBe(-0.06);
    expect(shockDelta({ ...s, week: 12 })).toBe(0);
  });

  it('gás e décimo terceiro abrem o choque com a duração certa', () => {
    const { s } = base(20);
    startIncident(s, 'gas', undefined, NEVER, [], 21);
    expect(s.incidents.shock).toEqual({ until: 25, payDelta: -0.06 });
    startIncident(s, 'decimo', undefined, NEVER, [], 21);
    expect(s.incidents.shock).toEqual({ until: 23, payDelta: 0.08 });
  });

  it('mesada e vereador reduzem a chance de inquérito (e acumulam)', () => {
    const open = (mesada: number, vereador: boolean, x: number) => {
      const { s } = base(30);
      s.police.heat = 60;
      s.incidents.mesada = mesada;
      s.incidents.vereadorUntil = vereador ? 40 : 0;
      tickPolice(s, fixedRng(x), [], 'alta');
      return !!s.police.inquiry;
    };
    const p = police.inquiryChance.alta;
    expect(open(0, false, p - 0.001)).toBe(true);
    expect(open(0, false, p + 0.001)).toBe(false);
    expect(open(600, false, p * 0.4 - 0.001)).toBe(true);
    expect(open(600, false, p * 0.4 + 0.001)).toBe(false);
    expect(open(0, true, p * 0.6 - 0.001)).toBe(true);
    expect(open(0, true, p * 0.6 + 0.001)).toBe(false);
    expect(open(600, true, p * 0.24 - 0.001)).toBe(true);
    expect(open(600, true, p * 0.24 + 0.001)).toBe(false);
  });
});

describe('notícias', () => {
  it('assalto leva 25% do caixa', () => {
    const { s } = base(10);
    s.cash = 20_000;
    const ev: GameEvent[] = [];
    startIncident(s, 'assalto', undefined, NEVER, ev, 11);
    expect(s.cash).toBe(15_000);
    expect(s.stats.spent).toBe(5_000);
    expect(ev[0]).toMatchObject({ id: 'assalto', amount: 5_000 });
  });

  it('some e tragédia perdem o empréstimo e baixam o saldo', () => {
    const { s, loan } = base(10);
    s.word = 30;
    s.police.heat = 0;
    const saldo = loan.totalDue - loan.totalPaid;
    const ev: GameEvent[] = [];
    startIncident(s, 'some', loan, NEVER, ev, 11);
    expect(s.loans[0]!.status).toBe('lost');
    expect(s.loans[0]!.endWeek).toBe(10);
    expect(s.stats.writtenOff).toBe(saldo);
    expect(s.word).toBe(29);
    const t = base(10);
    t.s.word = 30;
    startIncident(t.s, 'tragedia', t.loan, NEVER, [], 11);
    expect(t.s.loans[0]!.status).toBe('lost');
    expect(t.s.word).toBe(20);
    expect(t.s.police.heat).toBe(20);
  });

  it('cartão do INSS perde a garantia', () => {
    const { s, loan } = base(10);
    loan.collateral = { kind: 'inss', value: 2000 };
    startIncident(s, 'cartao', loan, NEVER, [], 11);
    expect(s.loans[0]!.collateral).toBeNull();
    expect(s.loans[0]!.status).toBe('active');
  });

  it('vereador e PM pagam ou não, pelo sorteio agendado', () => {
    for (const [id, value, until] of [
      ['vereador_paga', 5000, P.vereador.payChance],
      ['pm_paga', 3000, P.pm.payChance],
    ] as const) {
      const pays = base(30).s;
      pays.incidents.scheduled = [{ week: 30, id }];
      tickIncidents(pays, fixedRng(until - 0.01), []);
      expect(pays.cash).toBe(20_000 + value);
      expect(pays.stats.returned).toBe(value);
      const keeps = base(30).s;
      keeps.incidents.scheduled = [{ week: 30, id }];
      const ev: GameEvent[] = [];
      tickIncidents(keeps, fixedRng(until + 0.01), ev);
      expect(keeps.cash).toBe(20_000);
      expect(ev[0]).toMatchObject({ type: 'incident', id, amount: 0 });
      expect(keeps.incidents.scheduled).toEqual([]);
    }
  });

  it('tragédia traz a nota do CVV, sem piada', () => {
    const lines = newsTexts.tragedia!({ name: 'Seu Jorge' });
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain('188');
    expect(lines[1]).toContain('cvv.org.br');
    const report = reportLines({
      week: 1,
      cash: 0,
      fear: 0,
      word: 0,
      heat: 0,
      events: [{ type: 'incident', id: 'tragedia', name: 'Seu Jorge' }],
    });
    expect(report.some((l) => l.includes('188'))).toBe(true);
  });
});

describe('conteúdo', () => {
  it('toda ocorrência tem texto, e toda opção tem rótulo e linha do Jornal', () => {
    for (const id of allIncidents) {
      if (isDilemma(id)) {
        const t = dilemmaTexts[id];
        expect(t, id).toBeDefined();
        expect(t!.title({ name: 'Seu Jorge', amount: 100 }), id).toBeTruthy();
        expect(t!.body({ name: 'Seu Jorge', amount: 100 }), id).toBeTruthy();
        expect(Object.keys(t!.options).sort(), id).toEqual([...dilemmaOptions[id]!].sort());
        for (const [opt, o] of Object.entries(t!.options)) {
          expect(o.label({ name: 'Seu Jorge', amount: 100 }), `${id}/${opt}`).toBeTruthy();
          expect(o.line?.({ name: 'Seu Jorge', amount: 100 }), `${id}/${opt}`).toBeTruthy();
        }
      } else {
        for (const amount of [0, 100]) {
          const lines = newsTexts[id]?.({ name: 'Seu Jorge', amount });
          expect(lines?.length, id).toBeGreaterThan(0);
          for (const l of lines!) expect(l).toBeTruthy();
        }
      }
    }
  });

  it('o inquérito também tem cartão', () => {
    const t = dilemmaTexts.inquerito!;
    expect(Object.keys(t.options).sort()).toEqual([...dilemmaOptions.inquerito!].sort());
  });

  it('texto de devedor usa o nome do devedor', () => {
    const t = dilemmaTexts.rolar!;
    expect(t.title({ name: 'Dona Cida' })).toContain('Dona Cida');
    expect(dilemmaTexts.bem!.options.aceitar!.hint!({ name: 'Dona Cida', amount: 800 })).toContain(
      'R$ 800',
    );
  });
});

describe('painel dev', () => {
  it('força qualquer das 19 ocorrências e marca a partida', () => {
    for (const id of allIncidents) {
      const { s } = base(10);
      s.cash = 50_000;
      const after = devForceIncident(s, id);
      expect(after.devUsed).toBe(true);
      expect(
        after.queue.some((q) => q.event.type === 'incident'),
        id,
      ).toBe(true);
      if (isDilemma(id))
        expect(
          after.dilemmas.some((d) => d.kind === id),
          id,
        ).toBe(true);
    }
  });

  it('sem empréstimo, a ocorrência de devedor avisa', () => {
    const { s } = base(10);
    s.loans = [];
    expect(() => devForceIncident(s, 'some')).toThrow();
  });
});

describe('partidas inteiras', () => {
  it('o caixa fecha com o bot pagando tudo que pode', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const s = playBot(newGame(seed), 50, { monthlyRate: 25, weeks: 8, incidents: 'paga' });
      const { lent, received, recovered, seized, spent, returned } = s.stats;
      const p = s.pocket;
      expect(Number.isInteger(s.cash)).toBe(true);
      expect(s.cash).toBeGreaterThanOrEqual(0);
      expect(
        s.cash + p.own + p.laranja + p.offshore + p.blocked + s.stats.betrayed + s.stats.fees,
      ).toBe(params.startingCash - lent + received + recovered - seized - spent + returned);
      expect(s.police.heat).toBeGreaterThanOrEqual(0);
      expect(s.police.heat).toBeLessThanOrEqual(100);
      for (const l of s.loans) expect(l.totalPaid).toBeLessThanOrEqual(l.totalDue);
    }
  });

  it('o bot recusando tudo também fecha o caixa', () => {
    for (let seed = 1; seed <= 10; seed++) {
      const s = playBot(newGame(seed), 40, { monthlyRate: 25, weeks: 8, incidents: 'recusa' });
      expect(s.cash).toBeGreaterThanOrEqual(0);
      expect(s.week).toBe(41);
    }
  });

  it('o mesmo estado e a mesma semente dão a mesma partida', () => {
    const a = playBot(newGame(7), 30, { monthlyRate: 20, weeks: 8, incidents: 'paga' });
    const b = playBot(newGame(7), 30, { monthlyRate: 20, weeks: 8, incidents: 'paga' });
    expect(a).toEqual(b);
  });
});

describe('migração 5 → 6', () => {
  it('ganha ocorrências zeradas e contadores de gasto', () => {
    const s = playBot(newGame(7), 3, { monthlyRate: 20, weeks: 8 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- save antigo, sem tipo
    const v5 = JSON.parse(serialize(s)) as Record<string, any>;
    v5.saveVersion = 5;
    delete v5.incidents;
    delete v5.stats.spent;
    delete v5.stats.returned;
    const m = deserialize(JSON.stringify(v5));
    expect(m.saveVersion).toBe(6);
    expect(m.incidents).toEqual({
      last: {},
      scheduled: [],
      mesada: 0,
      militia: 'none',
      militiaRate: 0,
      rivalUntil: 0,
      primoOutUntil: 0,
      vereadorUntil: 0,
      shock: { until: 0, payDelta: 0 },
    });
    expect(m.stats.spent).toBe(0);
    expect(m.stats.returned).toBe(0);
    for (let i = 0; i < 3; i++) expect(() => step(m)).not.toThrow();
  });
});

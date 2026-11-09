// Relatório rápido de balanço: npx vite-node sim/balance.ts (COLLATERAL=1 para exigir garantia)
import { newGame, protectedWealth, type Compartment, type DilemmaOption } from '../src/engine';
import { allIncidents, drawable } from '../src/engine';
import { incidents as incidentParams } from '../src/content/params';
import { playBot, policies } from './bot';

const RUNS = Number(process.env.RUNS ?? 100);
/** WEEKS=n: semanas de cada partida. Padrão: 30. */
const WEEKS = Number(process.env.WEEKS ?? 30);
/** CRISE=nada|advogado|acordo|entregar|sumir: resposta do bot às crises. Padrão: nada. */
const crisis = (process.env.CRISE ?? 'nada') as
  'nada' | 'advogado' | 'acordo' | 'entregar' | 'sumir';
/** COLLATERAL=1: o bot exige a garantia mais forte. */
const collateral = process.env.COLLATERAL === '1';
/** POLICY=nada|conversa|padrao|primo (ou vários, separados por vírgula). */
/** INQ=correr|advogado|pagar: resposta do bot ao inquérito. */
const inquiry = (process.env.INQ ?? 'correr') as DilemmaOption;
/** POCKET=own|laranja|offshore: o bot guarda o caixa acima de R$ 15 mil. Padrão: nenhum. */
const pocket = (process.env.POCKET || null) as Compartment | null;
/** INC=padrao|paga|recusa: resposta do bot às ocorrências; INC=0 zera a chance semanal delas. */
const incMode = process.env.INC ?? 'padrao';
if (incMode === '0') incidentParams.chance = 0;
const incidents = (incMode === '0' ? 'padrao' : incMode) as 'padrao' | 'paga' | 'recusa';
const policyNames = (process.env.POLICY ?? 'padrao').split(',');
for (const policyName of policyNames) {
  for (const monthlyRate of (process.env.RATES ?? '5,10,20,30,50,80').split(',').map(Number)) {
    for (const weeks of (process.env.TERMS ?? '4,8,16').split(',').map(Number)) {
      let wealth = 0;
      let loans = 0;
      let defaults = 0;
      let fear = 0;
      let word = 0;
      let complaints = 0;
      let heat = 0;
      let inquiries = 0;
      let raids = 0;
      let kept = 0;
      let blocked = 0;
      let occurrences = 0;
      let tragedies = 0;
      let crises = 0;
      let jailed = 0;
      let dead = 0;
      let exiled = 0;
      const seen = new Set<string>();
      for (let seed = 1; seed <= RUNS; seed++) {
        const s = playBot(newGame(seed), WEEKS, {
          monthlyRate,
          weeks,
          collateral,
          policy: policies[policyName],
          inquiry,
          incidents,
          crisis,
          pocket,
        });
        fear += s.fear;
        word += s.word;
        complaints += s.complaints;
        heat += s.police.heat;
        const events = s.journal.flatMap((r) => r.events);
        if (events.some((e) => e.type === 'inquiryOpened')) inquiries += 1;
        if (events.some((e) => e.type === 'raid')) raids += 1;
        if (events.some((e) => e.type === 'crisisOpened')) crises += 1;
        if (s.ended?.kind === 'preso') jailed += 1;
        if (s.ended?.kind === 'morto') dead += 1;
        if (s.ended?.kind === 'exilado') exiled += 1;
        for (const e of events) {
          if (e.type !== 'incident') continue;
          occurrences += 1;
          seen.add(e.id);
        }
        if (events.some((e) => e.type === 'incident' && e.id === 'tragedia')) tragedies += 1;
        // Valor contábil conservador: o que falta receber, limitado ao principal, só de quem está em dia.
        kept += protectedWealth(s);
        blocked += s.pocket.blocked;
        wealth += s.ended
          ? s.ended.score
          : s.cash +
            protectedWealth(s) +
            s.pocket.blocked +
            s.loans
              .filter((l) => l.status === 'active' && l.missedStreak === 0)
              .reduce((sum, l) => sum + Math.min(l.principal, l.totalDue - l.totalPaid), 0);
        const closed = s.loans.filter((l) => l.startWeek <= WEEKS - l.weeks - 6);
        loans += closed.length;
        defaults += closed.filter((l) => l.status === 'defaulted').length;
      }
      console.log(
        `${policyName.padEnd(8)} ${(pocket ?? '-').padEnd(8)} ${String(monthlyRate).padStart(3)}% a.m. ${String(weeks).padStart(2)} sem | ` +
          `patrimônio médio em ${WEEKS} sem: ${Math.round(wealth / RUNS)} | ` +
          `calote: ${((100 * defaults) / loans).toFixed(1)}% | ` +
          `medo ${(fear / RUNS).toFixed(0)} | boca ${(word / RUNS).toFixed(0)} | denúncias ${(complaints / RUNS).toFixed(1)} | atenção ${(heat / RUNS).toFixed(0)} | ` +
          `inquérito ${((100 * inquiries) / RUNS).toFixed(0)}% | busca ${((100 * raids) / RUNS).toFixed(0)}% | ` +
          `protegido ${Math.round(kept / RUNS)} | bloqueado ${Math.round(blocked / RUNS)} | ` +
          `ocorrências ${(occurrences / RUNS).toFixed(1)} | distintas ${drawable.filter((id) => seen.has(id)).length}/${drawable.length} (${allIncidents.filter((id) => seen.has(id)).length}/${allIncidents.length}) | tragédia ${((100 * tragedies) / RUNS).toFixed(0)}% | crise ${((100 * crises) / RUNS).toFixed(0)}% | preso ${((100 * jailed) / RUNS).toFixed(0)}% | morto ${((100 * dead) / RUNS).toFixed(0)}% | exilado ${((100 * exiled) / RUNS).toFixed(0)}%`,
      );
    }
  }
}

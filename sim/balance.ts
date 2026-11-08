// Relatório rápido de balanço: npx vite-node sim/balance.ts (COLLATERAL=1 para exigir garantia)
import { newGame } from '../src/engine';
import { playBot, policies } from './bot';

const RUNS = Number(process.env.RUNS ?? 100);
const WEEKS = 30;
/** COLLATERAL=1: o bot exige a garantia mais forte. */
const collateral = process.env.COLLATERAL === '1';
/** POLICY=nada|conversa|padrao|primo (ou vários, separados por vírgula). */
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
      for (let seed = 1; seed <= RUNS; seed++) {
        const s = playBot(newGame(seed), WEEKS, {
          monthlyRate,
          weeks,
          collateral,
          policy: policies[policyName],
        });
        fear += s.fear;
        word += s.word;
        complaints += s.complaints;
        // Valor contábil conservador: o que falta receber, limitado ao principal, só de quem está em dia.
        wealth +=
          s.cash +
          s.loans
            .filter((l) => l.status === 'active' && l.missedStreak === 0)
            .reduce((sum, l) => sum + Math.min(l.principal, l.totalDue - l.totalPaid), 0);
        const closed = s.loans.filter((l) => l.startWeek <= WEEKS - l.weeks - 6);
        loans += closed.length;
        defaults += closed.filter((l) => l.status === 'defaulted').length;
      }
      console.log(
        `${policyName.padEnd(8)} ${String(monthlyRate).padStart(3)}% a.m. ${String(weeks).padStart(2)} sem | ` +
          `patrimônio médio em ${WEEKS} sem: ${Math.round(wealth / RUNS)} | ` +
          `calote: ${((100 * defaults) / loans).toFixed(1)}% | ` +
          `medo ${(fear / RUNS).toFixed(0)} | boca ${(word / RUNS).toFixed(0)} | denúncias ${(complaints / RUNS).toFixed(1)}`,
      );
    }
  }
}

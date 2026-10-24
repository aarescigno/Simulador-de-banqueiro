// Relatório rápido de balanço: npx vite-node sim/balance.ts
import { newGame } from '../src/engine';
import { playBot } from './bot';

const RUNS = Number(process.env.RUNS ?? 100);
const WEEKS = 30;
for (const monthlyRate of (process.env.RATES ?? '5,10,20,30,50,80').split(',').map(Number)) {
  for (const weeks of (process.env.TERMS ?? '4,8,16').split(',').map(Number)) {
    let wealth = 0;
    let loans = 0;
    let defaults = 0;
    for (let seed = 1; seed <= RUNS; seed++) {
      const s = playBot(newGame(seed), WEEKS, { monthlyRate, weeks });
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
      `${String(monthlyRate).padStart(3)}% a.m. ${String(weeks).padStart(2)} sem | ` +
        `patrimônio médio em ${WEEKS} sem: ${Math.round(wealth / RUNS)} | ` +
        `calote: ${((100 * defaults) / loans).toFixed(1)}%`,
    );
  }
}

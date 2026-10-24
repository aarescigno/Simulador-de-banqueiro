// Texto do Jornal a partir dos eventos do motor. Voz de relatório, frases curtas.
import type { GameEvent, WeekReport } from '../engine/state';
import { money, percent } from './format';
import { params } from './params';

/** Acima disso, o jornal conta em vez de listar. */
const MAX_NAMES = 4;

/** "Jorge", "Jorge e Cida", "Jorge, Cida e Marcos"; muitos viram "9 devedores". */
export function joinNames(names: string[]): string {
  if (names.length > MAX_NAMES) return `${names.length} devedores`;
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}`;
}

function ofType<T extends GameEvent['type']>(events: GameEvent[], type: T) {
  return events.filter((e): e is Extract<GameEvent, { type: T }> => e.type === type);
}

export function reportLines(r: WeekReport): string[] {
  const ev = r.events;
  const lines: string[] = [];

  if (ofType(ev, 'gameStarted').length)
    lines.push('Abre o caderninho. Bairro novo, clientela velha.');

  const paid = ofType(ev, 'paid');
  if (paid.length) {
    const total = paid.reduce((s, e) => s + e.amount, 0);
    const verb = paid.length === 1 ? 'pagou' : 'pagaram';
    lines.push(`${joinNames(paid.map((e) => e.name))} ${verb}. Recebido: ${money(total)}.`);
  }

  const missed = ofType(ev, 'missed');
  if (missed.length) {
    const verb = missed.length === 1 ? 'não pagou' : 'não pagaram';
    lines.push(`${joinNames(missed.map((e) => e.name))} ${verb}.`);
  }

  for (const e of ofType(ev, 'settled')) {
    lines.push(`${e.name} quitou. Lucro: ${money(e.profit)}.`);
  }

  for (const e of ofType(ev, 'defaulted')) {
    lines.push(
      `${e.name} não paga há ${params.payment.defaultAfterWeeks} semanas. Baixado: ${money(e.writtenOff)}.`,
    );
  }

  for (const e of ofType(ev, 'loanMade')) {
    lines.push(
      `Emprestado a ${e.name}: ${money(e.amount)} a ${percent(e.monthlyRate)} ao mês, ${e.weeks} semanas.`,
    );
  }

  const refused = ofType(ev, 'refused');
  if (refused.length) lines.push(`Recusado: ${joinNames(refused.map((e) => e.name))}.`);

  const expired = ofType(ev, 'expired');
  if (expired.length) {
    const verb = expired.length === 1 ? 'Foi pedir' : 'Foram pedir';
    lines.push(`Sem resposta para ${joinNames(expired.map((e) => e.name))}. ${verb} a outro.`);
  }

  for (const e of ofType(ev, 'devMoney')) {
    lines.push(`Entrada sem explicação: ${money(e.amount)}.`);
  }

  lines.push(`Caixa: ${money(r.cash)}.`);
  return lines;
}

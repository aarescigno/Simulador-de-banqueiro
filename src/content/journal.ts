// Texto do Jornal a partir dos eventos do motor. Voz de relatório, frases curtas.
import type { ComplaintSource, GameEvent, Level, WeekReport } from '../engine/state';
import { collateralText } from './collateral';
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

const paidAfter: Record<Level, (names: string, verb: string) => string> = {
  conversa: (n, v) => `${n} ${v} depois da conversa.`,
  pressao: (n, v) => `${n} ${v} depois de uma ligação para o trabalho.`,
  primo: (n, v) => `O primo passou lá ontem. ${n} ${v}.`,
};

const missedQuote: Record<Level, string> = {
  conversa: 'Prometeu sexta.',
  pressao: 'A família já sabe.',
  primo: 'O primo voltou de mãos vazias.',
};

const complaintText: Record<ComplaintSource, (name?: string) => string> = {
  pressao: () => 'Um patrão foi à delegacia reclamar de ligações.',
  primo: () => 'Boletim de ocorrência por ameaça. O endereço é do seu bairro.',
  moto: () => 'BO de moto tomada. A placa está no sistema.',
  celular: () => 'Celular tomado virou queixa na delegacia.',
  inss: (n) => `A família de ${n} foi ao INSS perguntar pelo cartão do benefício.`,
  ambiente: () => 'Alguém comentou com a ronda que no bairro todo mundo paga em dia.',
};

const levels: (Level | null)[] = [null, 'conversa', 'pressao', 'primo'];

export function reportLines(r: WeekReport): string[] {
  const ev = r.events;
  const lines: string[] = [];

  if (ofType(ev, 'gameStarted').length)
    lines.push('Abre o caderninho. Bairro novo, clientela velha.');

  const paid = ofType(ev, 'paid');
  for (const level of levels) {
    const group = paid.filter((e) => (e.level ?? null) === level);
    if (!group.length) continue;
    const total = group.reduce((s, e) => s + e.amount, 0);
    const verb = group.length === 1 ? 'pagou' : 'pagaram';
    const names = joinNames(group.map((e) => e.name));
    const head = level ? paidAfter[level](names, verb) : `${names} ${verb}.`;
    lines.push(`${head} Recebido: ${money(total)}.`);
  }

  const missed = ofType(ev, 'missed');
  for (const level of levels) {
    const group = missed.filter((e) => (e.level ?? null) === level);
    if (!group.length) continue;
    const verb = group.length === 1 ? 'não pagou' : 'não pagaram';
    const quote = level && group.length === 1 ? ` ${missedQuote[level]}` : '';
    lines.push(`${joinNames(group.map((e) => e.name))} ${verb}.${quote}`);
  }

  for (const e of ofType(ev, 'settled')) {
    lines.push(`${e.name} quitou. Lucro: ${money(e.profit)}.`);
  }

  for (const e of ofType(ev, 'defaulted')) {
    const seized = e.collateral
      ? ` ${collateralText[e.collateral].seized}${e.recovered ? `: ${money(e.recovered)}` : ''}.`
      : '';
    const lost = e.writtenOff > 0 ? ` Baixado: ${money(e.writtenOff)}.` : '';
    lines.push(
      `${e.name} não paga há ${params.payment.defaultAfterWeeks} semanas.${seized}${lost}`,
    );
  }

  for (const e of ofType(ev, 'forgiven')) {
    lines.push(`Dívida de ${e.name} perdoada: ${money(e.amount)}. O bairro comentou.`);
  }

  for (const e of ofType(ev, 'complaint')) lines.push(complaintText[e.source](e.name));

  for (const e of ofType(ev, 'loanMade')) {
    const guarantee = e.collateral ? ` Garantia: ${collateralText[e.collateral].noun}.` : '';
    lines.push(
      `Emprestado a ${e.name}: ${money(e.amount)} a ${percent(e.monthlyRate)} ao mês, ${e.weeks} semanas.${guarantee}`,
    );
  }

  const walked = ofType(ev, 'walkedOut');
  if (walked.length) {
    const verb = walked.length === 1 ? 'não topou a taxa. Foi' : 'não toparam a taxa. Foram';
    lines.push(`${joinNames(walked.map((e) => e.name))} ${verb} pedir a outro.`);
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

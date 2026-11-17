// Degrau 2: textos de interface e do Jornal. Voz de relatório, frases curtas. `{v}` = dinheiro.
import type { Compartment, EscLevel, GameEvent } from '../engine/state';
import { collateralText } from './collateral';
import { screen } from './esc';
import { money } from './format';
import { laranjas, type Laranja } from './pocket';

export const escUi = {
  tabs: {
    summary: 'Resumo',
    portfolio: 'Carteira',
    policies: 'Políticas',
    pocket: 'Bolso',
    journal: 'Jornal',
  },
  summary: {
    cash: 'Caixa da ESC',
    capital: 'Capital declarado',
    headroom: 'Livre para emprestar',
    book: 'Na rua',
    late: 'Em atraso',
    distributable: 'Lucro distribuível',
    pocket: 'Bolso protegido',
    writtenOff: 'Baixas',
    word: { name: 'Reputação', text: 'Atrai pedidos. Execução e calote derrubam.' },
  },
  portfolio: {
    overLimit: (free: string) => `Passa do limite · livre ${free}`,
    revenue: (v: string) => `Fatura ${v} por mês`,
    years: (n: number) =>
      n === 0 ? 'CNPJ deste ano' : n === 1 ? '1 ano de CNPJ' : `${n} anos de CNPJ`,
    clean: 'Nome limpo',
    serasa: 'Nome no Serasa',
    owner: (short: string, porte: string) => `${short} · ${porte}`,
    execute: 'Executar já',
    confirmExecute: (name: string, v: string) =>
      `Executar ${name} na Justiça? Recupera ${v}. O resto vira baixa.`,
    stepNow: { aviso: 'Ligação do escritório', serasa: 'Nome no Serasa' } as Record<
      Exclude<EscLevel, 'execucao'>,
      string
    >,
    executedStatus: (lost: string) => `Executado · baixado ${lost}`,
  },
  policies: {
    title: 'Políticas',
    collection: 'Cobrança da ESC',
    hint: 'A partir de quantas semanas de atraso cada passo vale. Vale para a carteira toda.',
    steps: {
      aviso: {
        name: 'Ligação do escritório',
        text: 'Lembrete educado. Ajuda um pouco a pagar.',
      },
      serasa: {
        name: 'Negativar no Serasa',
        text: 'Nome sujo na praça. Ajuda mais a pagar. A reputação da ESC sente um pouco.',
      },
      execucao: {
        name: 'Execução na Justiça',
        text: 'Encerra o contrato. Retoma a garantia ou penhora o que achar. O advogado fica com um quinto. A reputação sente.',
      },
    } as Record<EscLevel, { name: string; text: string }>,
  },
  pocket: {
    distribute: 'Distribuir lucro',
    distributeHint: 'Só sai da ESC o que passa do capital declarado.',
    available: (v: string) => `Lucro distribuível: ${v}.`,
    to: (name: string) => `Para ${name}`,
    nothing: 'Nada passa do capital agora.',
    capitalize: 'Capitalizar',
    capitalizeHint: 'O lucro vira capital: o limite sobe. Não volta mais para o bolso.',
    capitalizeBtn: (v: string) => `Capitalizar ${v}`,
    confirmCapitalize: (v: string) => `Capitalizar ${v}? Vira capital declarado. Não sai mais.`,
    noReturn: 'O que está no bolso não volta para a ESC. O capital é declarado; o bolso, não.',
    retire: 'Fechar a ESC e se aposentar',
    confirmRetire: 'Fechar a ESC? O caixa vai para você. O que está na rua fica na rua.',
    fichaTitle: 'Ficha do caderninho',
    realLife:
      'Na vida real: a Empresa Simples de Crédito (Lei Complementar 167/2019) empresta só capital próprio, e o total das operações não pode passar do capital realizado. Atende só MEI, micro e pequenas empresas do município da sede e dos vizinhos. A remuneração é só juros: tarifa é proibida. A Lei da Usura não se aplica, e a garantia pode ser alienação fiduciária. Captar dinheiro de terceiros é proibido.',
  },
};

const destination: Record<Compartment, (fee: string, who: string) => string> = {
  own: () => 'em seu nome',
  laranja: (fee, who) => `no nome de ${who}, menos ${fee}`,
  offshore: (fee) => `lá fora, menos ${fee}`,
};

function laranjaByShort(short: string): Laranja {
  return laranjas.find((l) => l.short === short) ?? laranjas[0]!;
}

function ofType<T extends GameEvent['type']>(events: GameEvent[], type: T) {
  return events.filter((e): e is Extract<GameEvent, { type: T }> => e.type === type);
}

/** "Jorge", "Jorge e Cida", "A, B e C"; muitos viram "9 devedores". */
function names(list: string[]): string {
  if (list.length > 4) return `${list.length} devedores`;
  if (list.length <= 1) return list.join('');
  return `${list.slice(0, -1).join(', ')} e ${list[list.length - 1]}`;
}

/**
 * Linhas do Jornal dos eventos do degrau 2: abertura, pagamentos e atrasos depois de um passo de
 * cobrança, execução, distribuição e capitalização. Pagamento e atraso sem passo ficam com as
 * linhas comuns do Jornal.
 */
export function escLines(events: GameEvent[], week: number): string[] {
  const lines: string[] = [];
  for (const e of ofType(events, 'escOpened')) {
    lines.push(screen.opening(week), screen.origin(e.route, laranjaByShort(e.who)));
  }
  const paid = ofType(events, 'paid').filter((e) => e.escLevel);
  for (const level of ['aviso', 'serasa'] as const) {
    const group = paid.filter((e) => e.escLevel === level);
    if (!group.length) continue;
    const verb = group.length === 1 ? 'pagou' : 'pagaram';
    const who = names(group.map((e) => e.name));
    const head =
      level === 'aviso'
        ? `${who} ${verb} depois da ligação do escritório.`
        : `${who} ${verb} para limpar o nome.`;
    lines.push(`${head} Recebido: ${money(group.reduce((s, e) => s + e.amount, 0))}.`);
  }
  const missed = ofType(events, 'missed').filter((e) => e.escLevel);
  for (const level of ['aviso', 'serasa'] as const) {
    const group = missed.filter((e) => e.escLevel === level);
    if (!group.length) continue;
    const verb = group.length === 1 ? 'não pagou' : 'não pagaram';
    const tail = level === 'serasa' ? ' Nome no Serasa.' : '';
    lines.push(`${names(group.map((e) => e.name))} ${verb}.${tail}`);
  }
  for (const e of ofType(events, 'executed')) {
    const lost = `Baixado: ${money(e.writtenOff)}.`;
    lines.push(
      e.collateral
        ? `${e.name}: execução na Justiça. ${collateralText[e.collateral].seized}: ${money(e.recovered)}. ${lost}`
        : `${e.name}: execução na Justiça. Penhora: ${money(e.recovered)}. ${lost}`,
    );
  }
  for (const e of ofType(events, 'distributed')) {
    lines.push(`Lucro distribuído: ${money(e.amount)} ${destination[e.to](money(e.fee), e.who)}.`);
  }
  for (const e of ofType(events, 'capitalized')) {
    lines.push(`Capital declarado sobe para ${money(e.capital)}. A junta comercial carimbou.`);
  }
  return lines;
}

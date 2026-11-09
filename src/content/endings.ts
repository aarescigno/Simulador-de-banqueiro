// Crise do degrau 1 e finais: cartões de dilema, linhas do Jornal, faixas do Resumo e telas finais.
// Morte e prisão sempre implícitas; nomes fictícios.
import type { CrisisKind, DilemmaKind, Ending, EndingPart, GameEvent } from '../engine/state';
import { money } from './format';
import { crisis as C } from './params';
import type { DilemmaText, TextCtx } from './incidents';

const s = (t: string) => (): string => t;
const m = (c: TextCtx) => money(c.amount ?? 0);

/** Cartões dos dois dilemas de crise; mesma forma de `dilemmaTexts`. */
export const crisisDilemmaTexts: Partial<Record<DilemmaKind, DilemmaText>> = {
  processo: {
    title: s('Processo'),
    body: s(
      `O inquérito virou denúncia do Ministério Público. Usura, crime contra o sistema financeiro, lavagem. Julgamento em ${C.trialWeeks} semanas.`,
    ),
    options: {
      nada: {
        label: s('Esperar o julgamento'),
        hint: s('O juiz decide.'),
        line: s('Sem providência. O processo segue o rito.'),
      },
      advogado: {
        label: s(`Contratar advogado · ${money(C.lawyer.cost)}`),
        hint: s('Bom advogado. Caro por isso.'),
        line: (c) => `Advogado contratado: ${m(c)}. Disse que já viu piores.`,
      },
      acordo: {
        label: (c) => `Acertar com o delegado · ${m(c)}`,
        hint: s('O processo some. De novo.'),
        line: (c) => `O processo voltou para a gaveta. Custo: ${m(c)}.`,
      },
      entregar: {
        label: s('Entregar o primo'),
        hint: s('Ele vai saber quem foi.'),
        line: s('O primo foi preso de manhã. Você estava em casa.'),
      },
      sumir: {
        label: s('Sumir por uns tempos'),
        hint: s(`${C.vanish.weeks} semanas fora. O caderninho fica.`),
        line: s('Bairro novo. O caderninho começa de novo.'),
      },
      fugir: {
        label: s('Fugir de vez'),
        hint: s('Termina aqui. Leva o que está lá fora.'),
        line: s('Uma mala e a rodoviária.'),
      },
    },
  },
  jurado: {
    title: s('Jurado'),
    body: s(
      'O recado agora veio sem palavras. Faz duas noites que tem um carro parado na frente de casa.',
    ),
    options: {
      ficar: {
        label: s('Ficar'),
        hint: s('Ninguém expulsa você do seu bairro.'),
        line: s('Você ficou. O carro também.'),
      },
      pagar: {
        label: (c) => `Pagar · ${m(c)}`,
        hint: s('Sessenta por cento do caixa, e 20% de tudo daqui para a frente.'),
        line: (c) => `Pago: ${m(c)}. O carro foi embora.`,
      },
      sumir: {
        label: s('Sumir por uns tempos'),
        hint: s(`${C.vanish.weeks} semanas fora. O caderninho fica.`),
        line: s('Bairro novo. O caderninho começa de novo.'),
      },
      fugir: {
        label: s('Fugir de vez'),
        hint: s('Termina aqui. Leva o que está lá fora.'),
        line: s('Uma mala e a rodoviária.'),
      },
    },
  },
};

/** Linhas do Jornal dos eventos de crise. */
export function crisisLine(e: GameEvent): string | null {
  if (e.type === 'crisisOpened') {
    return e.kind === 'processo'
      ? 'O Ministério Público ofereceu denúncia. Seu nome está na primeira linha.'
      : 'O carro voltou a parar na frente de casa.';
  }
  if (e.type === 'crisisEnded') {
    return e.how === 'absolvido'
      ? 'Absolvido por falta de provas. A Justiça liberou o bloqueio.'
      : 'O carro não voltou. A milícia agora leva 20%.';
  }
  return null;
}

/** Faixa da crise no Resumo. */
export const crisisStrip = (kind: CrisisKind, weeksLeft: number, lawyer: boolean): string => {
  const weeks = weeksLeft === 1 ? '1 semana' : `${weeksLeft} semanas`;
  return kind === 'processo'
    ? `Processo · julgamento em ${weeks}${lawyer ? ' · com advogado' : ''}`
    : `Jurado · ${weeks}`;
};

export interface EndingText {
  title: string;
  /** Duas linhas: o que aconteceu e o que fica com quem. */
  lines: (laranja: string) => [string, string];
}

export const endingTexts: Record<Ending, EndingText> = {
  preso: {
    title: 'Preso',
    lines: () => [
      'Usura, crime contra o sistema financeiro e lavagem. O juiz leu a sentença em quatro minutos.',
      'O que estava em seu nome ficou com a Justiça. O laranja e lá fora, não.',
    ],
  },
  morto: {
    title: 'Fim',
    lines: (laranja) => [
      'O velório foi de caixão fechado. O bairro não comentou.',
      `A família ficou com o que estava no seu nome e lá fora. ${laranja} ficou com o resto.`,
    ],
  },
  exilado: {
    title: 'Exilado',
    lines: () => [
      'Um ônibus de madrugada, uma mala, um nome novo.',
      'Metade do caixa na mala. O resto, lá fora.',
    ],
  },
  aposentado: {
    title: 'Aposentado',
    lines: () => [
      'Pendurou o caderninho. A carteira ficou na rua; alguém vai cobrar.',
      'Levou o caixa e o bolso.',
    ],
  },
};

/** Rótulo de cada parcela do placar, por final. */
export const partLabels: Record<EndingPart, string> = {
  cash: 'Caixa',
  own: 'Em seu nome',
  blocked: 'Bloqueado',
  laranja: 'Com o laranja',
  offshore: 'Lá fora',
};

export const endScreen = {
  score: 'Placar',
  cashExile: 'Metade do caixa',
  stats: (weeks: number, lent: string, lost: string, complaints: number) =>
    `Semanas: ${weeks} · Emprestado: ${lent} · Calote: ${lost} · Denúncias: ${complaints}`,
  newGame: 'Nova partida',
};

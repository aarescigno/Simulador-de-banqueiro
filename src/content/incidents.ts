// Textos das ocorrências: cartões de dilema, linhas do Jornal e notícias. Nomes fictícios.
// Violência e tragédia sempre implícitas; a tragédia traz a nota do CVV.
import type { DilemmaKind, DilemmaOption, IncidentId } from '../engine/state';
import { money, percent } from './format';
import { crisisDilemmaTexts } from './endings';
import { incidents as P, police } from './params';

/** O que os textos podem interpolar: nome do devedor e valores. */
export interface TextCtx {
  name?: string;
  amount?: number;
}

type Text = (c: TextCtx) => string;
const n = (c: TextCtx) => c.name ?? 'O devedor';
const m = (c: TextCtx) => money(c.amount ?? 0);

export interface OptionText {
  label: Text;
  /** Dica sob o botão. */
  hint?: Text;
  /** O custo da opção vem somado ao rótulo (inquérito). */
  showCost?: boolean;
  /** Linha do Jornal quando a opção é escolhida (ou vale por padrão); o inquérito tem a sua em journal.ts. */
  line?: Text;
}

export interface DilemmaText {
  title: Text;
  body: Text;
  /** Na ordem em que aparecem no cartão. */
  options: Record<DilemmaOption, OptionText>;
}

const s =
  (t: string): Text =>
  () =>
    t;

export const dilemmaTexts: Partial<Record<DilemmaKind, DilemmaText>> = {
  ...crisisDilemmaTexts,
  inquerito: {
    title: s('Inquérito'),
    body: s(
      'A delegacia abriu inquérito por usura. O escrivão deu a entender que papel às vezes some.',
    ),
    options: {
      pagar: {
        label: s('Molhar a mão'),
        hint: s('O inquérito some. A atenção fica, e o preço sobe.'),
        showCost: true,
      },
      advogado: {
        label: s('Contratar advogado'),
        hint: s(`${police.inquiry.weeks} semanas de inquérito, com defesa.`),
        showCost: true,
      },
      correr: {
        label: s('Deixar correr'),
        hint: s(`${police.inquiry.weeks} semanas. Depende do que acharem.`),
      },
    },
  },
  delegado: {
    title: s('Café com o delegado'),
    body: s(
      'O delegado Moacir passou para um café. Disse que o bairro anda agitado e que ele sabe acalmar.',
    ),
    options: {
      recusar: {
        label: s('Agradecer o café'),
        hint: s('Ele não gostou.'),
        line: s('O delegado saiu sem terminar o café.'),
      },
      mesada: {
        label: s(`Pagar a mesada · ${money(P.delegado.mesada)} por semana`),
        hint: s('Inquérito fica mais raro enquanto pagar.'),
        line: s('Mesada combinada com o delegado. Toda sexta.'),
      },
    },
  },
  milicia: {
    title: s('O bairro tem dono'),
    body: s(
      `Dois homens de colete passaram para conhecer o negócio. Querem ${percent(P.milicia.rate * 100)} do que entra.`,
    ),
    options: {
      pagar: {
        label: s(`Pagar ${percent(P.milicia.rate * 100)}`),
        hint: s('Quem não responde, paga.'),
        line: s('Combinado com os rapazes de colete. Sem recibo.'),
      },
      recusar: {
        label: s('Dizer que o negócio é seu'),
        hint: s('Eles voltam.'),
        line: s('Os dois saíram sem discutir. Anotaram o endereço.'),
      },
    },
  },
  milicia_recado: {
    title: s('Recado'),
    body: s(
      `O primo apareceu com o olho roxo. Mandaram dizer que agora são ${percent(P.milicia_recado.rate * 100)}.`,
    ),
    options: {
      pagar: {
        label: s(`Pagar ${percent(P.milicia_recado.rate * 100)}`),
        line: s(`A parte do bairro subiu para ${percent(P.milicia_recado.rate * 100)}.`),
      },
      recusar: {
        label: s('Recusar de novo'),
        hint: s('Eles sabem onde fica a gaveta.'),
        line: (c) => `Levaram o cofre. ${m(c)}. Ninguém viu nada.`,
      },
    },
  },
  rival: {
    title: s('Concorrência'),
    body: s('Abriu um agiota na rua de baixo. Cobra 10% ao mês e não pergunta nada.'),
    options: {
      ignorar: {
        label: s('Ignorar'),
        hint: s(`Menos gente na porta por ${P.rival.weeks} semanas.`),
        line: s('A clientela da rua de baixo agora tem outro endereço.'),
      },
      primo: {
        label: s('Mandar o primo conversar'),
        hint: s('Resolve. Chama atenção.'),
        line: s('O primo conversou com o rival. O rival mudou de rua.'),
      },
    },
  },
  rolar: {
    title: (c) => `${n(c)} quer rolar`,
    body: (c) =>
      `${n(c)} pede mais para pagar a própria parcela. Jura que o bico novo começa segunda.`,
    options: {
      recusar: {
        label: s('Recusar'),
        line: (c) => `${n(c)} saiu sem a rolagem.`,
      },
      rolar: {
        label: s('Rolar a dívida'),
        hint: s('Em dia no caderninho. A dívida cresce.'),
        line: (c) => `${n(c)} rolou a dívida. Em dia no caderninho.`,
      },
    },
  },
  bem: {
    title: (c) => `${n(c)} oferece a geladeira`,
    body: (c) => `${n(c)} oferece a geladeira para fechar a conta. Está ligada, tem gelo.`,
    options: {
      recusar: {
        label: s('Recusar'),
        line: (c) => `A geladeira de ${n(c)} continua com ${n(c)}.`,
      },
      aceitar: {
        label: s('Aceitar a geladeira'),
        hint: (c) => `Fecha a conta. Vende por uns ${m(c)}.`,
        line: (c) => `Geladeira de ${n(c)} vendida: ${m(c)}. A conta fechou.`,
      },
    },
  },
  pastor: {
    title: s('Oferta'),
    body: s('O pastor pede uma oferta para o telhado do templo.'),
    options: {
      recusar: {
        label: s('Dizer que está difícil'),
        line: s('O pastor agradeceu a visita. No culto, falou de avareza.'),
      },
      dar: {
        label: s(`Dar ${money(P.pastor.cost)}`),
        hint: s('O pastor fala bem de você no culto.'),
        line: s(
          `Oferta de ${money(P.pastor.cost)} para o telhado. O pastor citou seu nome, sem o sobrenome.`,
        ),
      },
    },
  },
  vereador: {
    title: s('Entre amigos'),
    body: s(
      `O vereador Dorival pede ${money(P.vereador.cost)} até a eleição. Sem juros, entre amigos.`,
    ),
    options: {
      recusar: {
        label: s('Recusar'),
        line: s('O vereador disse que não esquece.'),
      },
      emprestar: {
        label: s(`Emprestar · ${money(P.vereador.cost)}`),
        hint: s('Ele conhece o delegado. Pagar, talvez.'),
        line: s(`${money(P.vereador.cost)} para o vereador Dorival. Sem papel, entre amigos.`),
      },
    },
  },
  radio: {
    title: s('Rádio comunitária'),
    body: s('A rádio do bairro vai fazer um programa sobre juros.'),
    options: {
      ignorar: {
        label: s('Ignorar'),
        line: s('O programa foi ao ar. Teve ligação de ouvinte.'),
      },
      pagar: {
        label: s(`Patrocinar o programa · ${money(P.radio.cost)}`),
        hint: s('O programa vira sobre financiamento de carro.'),
        line: s('O programa falou de financiamento de carro. Uma hora inteira.'),
      },
    },
  },
  fianca: {
    title: s('O primo na blitz'),
    body: s('O primo foi detido numa blitz. Estava com a lista de endereços.'),
    options: {
      deixar: {
        label: s('Deixar lá'),
        hint: s(`Sem primo por ${P.fianca.primoOutWeeks} semanas. Ele pode falar.`),
        line: s('O primo ficou na delegacia. A lista de endereços também.'),
      },
      pagar: {
        label: s(`Pagar a fiança · ${money(P.fianca.cost)}`),
        line: s(
          `Fiança de ${money(P.fianca.cost)}. O primo voltou para casa e perguntou quando era o próximo.`,
        ),
      },
    },
  },
  pm: {
    title: s('Favor'),
    body: s(`Um PM do batalhão pede ${money(P.pm.cost)}. Diz que paga quando der.`),
    options: {
      recusar: {
        label: s('Recusar'),
        line: s('O PM disse que passa depois.'),
      },
      emprestar: {
        label: s(`Emprestar · ${money(P.pm.cost)}`),
        hint: s('A ronda passa menos.'),
        line: s(`${money(P.pm.cost)} para o PM. A ronda passou menos.`),
      },
    },
  },
};

const cvv =
  'Se você ou alguém próximo precisar conversar, o CVV atende 24 horas pelo 188 ou em cvv.org.br.';

/** Linhas do Jornal de cada ocorrência do tipo notícia (e dos retornos agendados). */
export const newsTexts: Partial<Record<IncidentId, (c: TextCtx) => string[]>> = {
  assalto: (c) => [
    `Entraram na sua casa de madrugada. Levaram ${m(c)} da gaveta. Não dá para registrar BO.`,
  ],
  some: (c) => [`${n(c)} mudou de cidade de madrugada. A casa está para alugar.`],
  tragedia: (c) => [
    `${n(c)} não vai mais pagar. A família fechou a casa e pediu que ninguém passasse por lá.`,
    cvv,
  ],
  gas: () => ['O gás subiu de novo. O bairro aperta o cinto.'],
  decimo: () => ['Saiu o décimo terceiro de quem tem carteira assinada.'],
  cartao: (c) => [`O INSS trocou o cartão de benefício de ${n(c)}. O antigo não passa mais.`],
  vereador_paga: (c) => [
    c.amount
      ? `O vereador devolveu os ${m(c)}. Pediu voto.`
      : `O vereador perdeu a eleição. Os ${money(P.vereador.cost)} também.`,
  ],
  pm_paga: (c) => [
    c.amount
      ? `O PM devolveu os ${m(c)}. Trouxe um bolo.`
      : `O PM foi transferido. Os ${money(P.pm.cost)} ficaram.`,
  ],
};

/** Linhas dos eventos contínuos. */
export const continuing = {
  militiaCut: (amount: number) => `A parte do bairro: ${money(amount)}.`,
  mesadaFailed: 'A mesada atrasou. O delegado não ligou para cobrar. Isso é pior.',
};

/** Faixas do Resumo para efeitos contínuos ativos. */
export const strips = {
  mesada: (amount: number) => `Mesada: ${money(amount)}/semana`,
  militia: (rate: number) => `Milícia: ${percent(rate * 100)} do que entra`,
  rival: (until: number) => `Rival na rua de baixo · até a semana ${until}`,
  primoOut: (until: number) => `Primo fora · até a semana ${until}`,
};

/** Nomes das ocorrências para o painel dev. */
export const incidentNames: Record<IncidentId, string> = {
  delegado: 'delegado',
  milicia: 'milícia',
  milicia_recado: 'milícia · recado',
  rival: 'rival',
  rolar: 'devedor quer rolar',
  bem: 'devedor oferece bem',
  pastor: 'pastor',
  vereador: 'vereador',
  vereador_paga: 'vereador paga',
  radio: 'rádio',
  fianca: 'fiança do primo',
  pm: 'PM',
  pm_paga: 'PM paga',
  jurado: 'jurado (crise)',
  assalto: 'assalto',
  some: 'devedor some',
  tragedia: 'tragédia',
  gas: 'gás',
  decimo: 'décimo terceiro',
  cartao: 'cartão do INSS',
};

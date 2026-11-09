// Todo texto de interface exibido ao jogador.
export const ui = {
  title: 'Agiota S.A.',
  tagline: 'Do agiota ao banco: o mesmo negócio, com CNPJ.',
  version: (v: string) => `versão ${v}`,

  update: {
    message: 'Nova versão.',
    action: 'Atualizar',
    later: 'Depois',
  },

  warning: {
    title: 'Aviso de conteúdo',
    body: [
      'Este jogo é uma sátira sobre crédito, dívida e cobrança.',
      'Há menções indiretas a violência, endividamento extremo e suicídio. Nada é mostrado de forma gráfica.',
      'Pessoas, bancos e cidades são fictícios.',
    ],
    cvv: 'Se precisar conversar, o CVV atende 24 horas pelo telefone 188 ou em cvv.org.br.',
    ok: 'Entendi',
  },

  menu: {
    continue: 'Continuar',
    newGame: 'Nova partida',
    confirmNewGame: 'Começar outra partida apaga a atual. Continuar?',
    exportSave: 'Exportar save',
    importSave: 'Importar save',
    exportHint: 'Copie o texto e guarde onde quiser.',
    importHint: 'Cole o texto de um save exportado.',
    copy: 'Copiar',
    copied: 'Copiado.',
    load: 'Carregar',
    close: 'Fechar',
    week: (w: number) => `Semana ${w}`,
    importError: (msg: string) => `Não deu: ${msg}`,
  },

  tabs: {
    summary: 'Resumo',
    portfolio: 'Carteira',
    policies: 'Políticas',
    pocket: 'Bolso',
    journal: 'Jornal',
  },

  header: {
    week: (w: number) => `Semana ${w}`,
    back: 'Menu',
  },

  summary: {
    cash: 'Caixa',
    receivable: 'A receber',
    pocket: 'Bolso',
    writtenOff: 'Calote',
    debtors: 'Devedores',
    late: 'Atrasados',
    waiting: (n: number) => (n === 1 ? '1 pedido na porta.' : `${n} pedidos na porta.`),
    seeRequests: 'Ver pedidos',
    advance: 'Avançar semana',
    headline: 'Semana',
    noHeadline: 'Nada a relatar ainda.',
  },

  portfolio: {
    title: 'Carteira',
    requests: 'Na porta',
    noRequests: 'Ninguém na porta esta semana.',
    active: 'Na rua',
    noLoans: 'Nenhum empréstimo na rua.',
    closed: 'Encerrados',
    asks: (amount: string) => `Pede ${amount}`,
    rate: 'Taxa',
    rateValue: (pct: string) => `${pct} ao mês`,
    rateShort: (pct: string) => `${pct} a.m.`,
    term: 'Prazo',
    termValue: (w: number) => `${w} semanas`,
    quote: (installment: string, total: string) => `Parcela ${installment}/semana · total ${total}`,
    lend: 'Oferecer',
    collateral: 'Garantia',
    noCollateral: 'Sem garantia',
    asset: (label: string, value: string, perMonth?: boolean) =>
      `${label} · ${value}${perMonth ? '/mês' : ''}`,
    counter: (pct: string, collateral: string | null) =>
      collateral ? `“Deixando ${collateral}, só fecho a ${pct}.”` : `“A ${pct} eu fecho.”`,
    takeCounter: (pct: string) => `Fechar a ${pct}`,
    guarantee: (label: string) => `Garantia: ${label.toLowerCase()}`,
    refuse: 'Recusar',
    noCash: 'Caixa não cobre.',
    progress: (paid: number, weeks: number) => `${paid}/${weeks} parcelas`,
    installment: (v: string) => `${v}/semana`,
    late: (w: number) => (w === 1 ? '1 semana sem pagar' : `${w} semanas sem pagar`),
    upToDate: 'Em dia',
    levelNow: (level: string) => `Esta semana: ${level}`,
    collectionLabel: 'Cobrança',
    rule: 'Regra',
    forgive: 'Perdoar dívida',
    confirmForgive: (amount: string) => `Perdoar ${amount}? O bairro vai saber.`,
    forgivenStatus: (amount: string) => `Perdoado · ${amount}`,
    paid: (profit: string) => `Quitou · lucro ${profit}`,
    defaulted: (lost: string) => `Calote · baixado ${lost}`,
    lost: (lost: string) => `Caderninho apreendido · baixado ${lost}`,
  },

  policies: {
    title: 'Políticas',
    collection: 'Cobrança',
    collectionHint: 'Regra para todo devedor em atraso. Exceções na Carteira.',
    from: 'Aplicar a partir de',
    never: 'Nunca',
    week: (n: number) => `${n}ª semana de atraso`,
  },

  levels: {
    conversa: { name: 'Conversa', chip: 'Conversa', text: 'Passar lá, lembrar da data.' },
    pressao: { name: 'Pressão', chip: 'Pressão', text: 'Ligar no trabalho. Falar com a família.' },
    primo: { name: 'Mandar o primo', chip: 'Primo', text: 'O primo resolve. Não pergunte como.' },
  },

  meters: {
    fear: { name: 'Medo', text: 'Faz todo mundo pagar. Afasta quem tem opção.' },
    word: { name: 'Boca a boca', text: 'Traz pedidos. E gente perguntando.' },
    heat: { name: 'Atenção', text: 'Denúncia vira atenção. Atenção vira inquérito.' },
  },

  heat: {
    baixa: 'Baixa',
    media: 'Média',
    alta: 'Alta',
    inquiry: (weeks: number, lawyer: boolean) =>
      `Inquérito aberto · ${weeks === 1 ? 'falta 1 semana' : `faltam ${weeks} semanas`}${lawyer ? ' · com advogado' : ''}`,
  },

  dilemma: {
    noCash: 'Caixa não cobre.',
    decideFirst: 'Decida antes de avançar.',
  },

  pocket: {
    title: 'Bolso',
    protectedLabel: 'Protegido',
    tagline: 'O caixa trabalha. O bolso é seu. O placar é o que estiver protegido no fim.',
    blocked: (amount: string, week: number) =>
      `Bloqueado pela Justiça: ${amount} · libera na semana ${week}`,
    amountLabel: 'Valor',
    amountHint: 'Valor em reais',
    shortcuts: { k1: '+1 mil', k5: '+5 mil', all: 'Todo o caixa', zero: 'Zerar' },
    stash: 'Guardar',
    take: 'Tirar',
    names: {
      own: 'Em seu nome',
      laranja: (short: string) => `No nome de ${short}`,
      offshore: 'Lá fora',
    },
    texts: {
      own: 'Sem custo. Bloqueado se a polícia bater na sua porta.',
      laranja: (short: string, pct: string, his: string) =>
        `${short} fica com ${pct} de cada depósito. Fora do seu nome, dentro do ${his}.`,
      offshore: (fee: string, min: string) =>
        `O doleiro cobra ${fee} na ida e ${fee} na volta, mínimo ${min}. A polícia não alcança. O doleiro, às vezes, sim.`,
    },
    balance: 'Saldo',
    noAmount: 'Digite um valor.',
    noCash: 'Caixa não cobre.',
    noBalance: 'Saldo não cobre.',
    belowMin: (min: string) => `Mínimo ${min} na remessa.`,
    confirmStash: {
      own: (amount: string) => `Guardar ${amount} em seu nome?`,
      laranja: (amount: string, short: string, fee: string) =>
        `Guardar ${amount}? ${short} fica com ${fee}.`,
      offshore: (amount: string, fee: string) => `Mandar ${amount}? O doleiro fica com ${fee}.`,
    },
    confirmTake: {
      offshore: (amount: string, fee: string) => `Trazer ${amount}? O doleiro fica com ${fee}.`,
    },
  },

  dev: {
    title: 'Painel dev',
    seed: 'Semente',
    newWithSeed: 'Nova partida com esta semente',
    money: 'Dar dinheiro',
    give: 'Dar',
    weeks: 'Avançar semanas',
    advance: 'Avançar',
    hidden: 'Variáveis ocultas',
    noGame: 'Sem partida em andamento.',
    copyState: 'Copiar estado',
    copied: 'Estado copiado. Cole na issue.',
    forceIncident: 'Forçar ocorrência',
    force: 'Forçar',
    close: 'Fechar',
    report: (version: string, seed: number, week: number, save: string) =>
      `Agiota S.A. ${version}\nsemente: ${seed}\nsemana: ${week}\nsave: ${save}`,
  },

  journal: {
    title: 'Jornal',
    empty: 'Nenhuma edição ainda. Avance uma semana.',
    edition: (w: number) => `Semana ${w}`,
  },
};

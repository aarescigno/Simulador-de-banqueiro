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
    advance: 'Avançar semana',
    headline: 'Última semana',
    noHeadline: 'Nada a relatar ainda.',
  },

  portfolio: {
    title: 'Carteira',
    empty: 'Ninguém bateu na porta ainda.',
  },

  policies: {
    title: 'Políticas',
    soon: 'Cobrança em níveis chega no próximo marco. Por ora, a cobrança é a conversa de sempre.',
  },

  pocket: {
    title: 'Bolso',
    soon: 'Em seu nome, laranja, offshore. Ainda não. Por enquanto, todo o dinheiro está no caixa.',
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

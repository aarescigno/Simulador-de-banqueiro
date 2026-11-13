// Abrir a ESC: textos do painel, do Jornal e da tela "em breve". Voz de relatório, frases curtas.
import type { GameEvent, LaunderRoute, MilitiaState } from '../engine/state';
import { money, percent } from './format';
import { esc as E } from './params';
import type { Laranja } from './pocket';

const K = () => money(E.capital);

export interface RouteText {
  name: (l: Laranja) => string;
  what: (l: Laranja) => string;
  cost: (v: string) => string;
  term: string;
  risk: (l: Laranja) => string;
}

export const routeOrder: LaunderRoute[] = ['consultoria', 'fachada', 'laranja', 'devagar'];

export const routes: Record<LaunderRoute, RouteText> = {
  consultoria: {
    name: () => 'Consultoria',
    what: () =>
      'Você vira consultor financeiro. Emite nota, recolhe imposto, o dinheiro entra declarado.',
    cost: (v) => `Custo: ${v} de imposto de renda (${percent(E.consultoria.tax * 100)}).`,
    term: 'Prazo: 1 semana.',
    risk: () => 'Risco: a Receita um dia pergunta quem eram os clientes.',
  },
  fachada: {
    name: () => 'Lava-rápido',
    what: () => 'Um lava-rápido numa rua sem movimento. O caixa da loja engole o do caderninho.',
    cost: (v) => `Custo: ${v} entre ponto, máquina e Simples.`,
    term: `Prazo: ${E.fachada.weeks} semanas, o tempo de o dinheiro passar pela loja.`,
    risk: () =>
      'Risco: uma busca nesse meio-tempo acha os recibos. Depois, a Receita compara o faturamento com a rua.',
  },
  laranja: {
    name: (l) => `${l.short} de sócio`,
    what: (l) => `A ESC sai no nome de ${l.name}. Você assina como procurador.`,
    cost: (v) => `Custo: ${v}, entre a assinatura e a comissão.`,
    term: 'Prazo: 1 semana.',
    risk: (l) => `Risco: a empresa é ${l.his}. No papel, para sempre.`,
  },
  devagar: {
    name: () => 'Devagar',
    what: () =>
      'Um MEI de verdade. Declara toda semana o que um MEI pode faturar, nem um real a mais.',
    cost: () => 'Custo: nenhum.',
    term: `Prazo: ${money(E.devagar.perWeek)} por semana, ${Math.ceil(E.capital / E.devagar.perWeek)} semanas se o caixa deixar.`,
    risk: () => 'Risco: nenhum no papel. O caderninho segue aberto o tempo todo.',
  },
};

export const panel = {
  title: 'Abrir uma ESC',
  intro:
    'Empresa Simples de Crédito: juros livres, contrato, CNPJ. Só empresta capital próprio, declarado. O seu veio do caderninho.',
  capital: () => `Capital exigido: ${K()}.`,
  tooEarly: (week: number) => `A partir da semana ${week}.`,
  crisis: 'Com crise aberta, nenhum contador atende.',
  outlay: (v: string) => `Sai do caixa agora: ${v}.`,
  noCash: 'Caixa não cobre. O que está em seu nome pode voltar para o caixa.',
  choose: 'Escolher',
  confirmChoose: (route: string, v: string) =>
    `${route}: sai ${v} do caixa. Não tem volta. Seguir?`,
  usesLaranja: (short: string, v: string) => `Usa primeiro o que já está com ${short}: ${v}.`,
  ready: () => `Capital limpo: ${K()}. A ESC pode abrir.`,
  sale: (n: number, v: string) =>
    n === 0
      ? 'Nenhum empréstimo na rua. O caderninho fecha zerado.'
      : n === 1
        ? `Um colega do ramo fica com o empréstimo na rua por ${v}.`
        : `Um colega do ramo fica com os ${n} empréstimos na rua por ${v}.`,
  leftover: 'O que sobrar do caixa vai para o seu nome.',
  open: 'Abrir a ESC',
  confirmOpen: (v: string) => `Abrir a ESC? O caderninho é vendido por ${v}. Não tem volta.`,
  blocks: {
    inquiry: 'Com inquérito aberto, o contador pede para esperar.',
    dilemma: 'Decida o que está pendente no Resumo antes.',
    crisis: 'Com crise aberta, nenhum contador atende.',
  },
  inProgress: 'Em andamento',
  realLife:
    'Na vida real: a ESC (Lei Complementar 167/2019) só empresta capital próprio, e só a MEI, micro e pequenas empresas do próprio município. Esconder a origem do lucro da agiotagem é lavagem de dinheiro (Lei 9.613/1998), com reclusão de 3 a 10 anos. Empresa de fachada com faturamento inflado e conta de laranja estão entre as tipologias mais comuns; costumam cair no cruzamento de dados fiscais com a movimentação.',
};

/** Faixa do painel e do Resumo com a lavagem em andamento. */
export function progressStrip(
  route: LaunderRoute,
  readyWeek: number | null,
  capital: number,
  ready: boolean,
): string {
  if (ready) return 'ESC pronta para abrir · no Bolso';
  if (route === 'devagar') return `MEI · ${money(capital)} de ${K()} declarados`;
  if (route === 'fachada') return `Lava-rápido · capital limpo na semana ${readyWeek}`;
  return `ESC · papéis na junta · semana ${readyWeek}`;
}

const launderedLine: Record<LaunderRoute, (cost: string, who: string) => string> = {
  consultoria: (v) =>
    `Primeira nota de consultoria emitida. Cliente: não informado. Imposto recolhido: ${v}.`,
  fachada: (v) =>
    `Lava-rápido inaugurado. Custo: ${v}. Nenhum carro no primeiro dia. Faturamento recorde.`,
  laranja: (v, who) => `${who} assinou o contrato social sem ler. Custo: ${v}.`,
  devagar: () => 'MEI aberto. Atividade declarada: consultoria em gestão.',
};

const readyLine: Record<LaunderRoute, string> = {
  consultoria: 'Contrato social registrado na junta comercial. A ESC pode abrir.',
  laranja: 'Contrato social registrado na junta comercial. A ESC pode abrir.',
  fachada: 'O lava-rápido fechou o caixa no azul. O capital está limpo. A ESC pode abrir.',
  devagar: 'Último boleto do MEI compensado. O capital está limpo. A ESC pode abrir.',
};

/** Linha do Jornal dos eventos da ESC; null se o evento não é desta família. */
export function escLine(e: GameEvent): string | null {
  switch (e.type) {
    case 'escAvailable':
      return 'Um contador do centro deixou um cartão: "Empresa Simples de Crédito. Juros livres, tudo dentro da lei. Só falta o capital."';
    case 'laundered':
      return launderedLine[e.route](money(e.cost), e.who);
    case 'escReady':
      return readyLine[e.route];
    case 'fachadaCaught':
      return `A busca achou os recibos do lava-rápido. ${money(e.amount)} foram para o bloqueio judicial.`;
    default:
      return null;
  }
}

/** Tela "em breve" do degrau 2. */
export const screen = {
  title: 'ESC aberta',
  opening: (week: number) =>
    `Semana ${week}. CNPJ ativo, capital declarado de ${K()}. A junta comercial não perguntou de onde veio.`,
  origin: (route: LaunderRoute, l: Laranja): string =>
    route === 'consultoria'
      ? 'Origem do capital: honorários de consultoria, imposto pago.'
      : route === 'fachada'
        ? 'Origem do capital: lucro de um lava-rápido sem carros.'
        : route === 'laranja'
          ? `Sócio-administrador: ${l.short}. Você assina como procurador.`
          : 'Origem do capital: faturamento de MEI, declarado semana a semana.',
  book: (n: number, v: string) =>
    n === 0
      ? 'O caderninho fechou sem ninguém devendo.'
      : n === 1
        ? `O caderninho foi vendido a um colega do ramo por ${v}. Um devedor mudou de credor sem ser avisado.`
        : `O caderninho foi vendido a um colega do ramo por ${v}. ${n} devedores mudaram de credor sem ser avisados.`,
  leftover: (v: string) => `Sobrou ${v} do caixa antigo. Foi para o seu nome.`,
  fichaTitle: 'Ficha',
  ficha: {
    weeks: 'Semanas de caderninho',
    complaints: 'Denúncias',
    raids: 'Buscas',
    bribes: 'Propinas',
    heat: 'Atenção',
    primo: 'O primo',
    primoGone: 'Entregue',
    primoActive: 'Na ativa',
    mesada: 'Mesada do delegado',
    mesadaOk: 'Em dia',
    mesadaNo: 'Não',
    militia: 'Milícia',
  },
  militia: {
    none: 'Nunca apareceu',
    paying: 'Recebe a parte dela',
    refused: 'Recusada',
    refusedTwice: 'Recusada duas vezes',
  } as Record<MilitiaState, string>,
  cash: 'Caixa da ESC',
  protected: 'Bolso protegido',
  soon: 'A ESC abre na próxima versão. Esta partida fica salva até lá.',
  newGame: 'Nova partida',
  confirmNew: 'Começar outra partida apaga esta, com ESC e tudo. Continuar?',
};

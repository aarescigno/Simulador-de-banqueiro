// Degrau 2: empresas, segmentos, motivos e cidades das fichas da ESC. Tudo fictício.
import type { Porte } from '../engine/state';

export const cities = {
  seat: 'São Jurandir do Norte',
  neighbors: ['Barra do Jurandir', 'Vila Serena'],
  neighborTag: 'município vizinho',
  distantTag: 'fora da área',
};

export const pfReason = 'Abro um MEI amanhã, se precisar.';
export const pfSegment = 'Sem CNPJ';

export const porteLabel: Record<Porte, string> = {
  mei: 'MEI',
  micro: 'Microempresa',
  pequena: 'Pequena empresa',
  pf: 'Pessoa física',
  media: 'Média empresa',
};

export interface Segment {
  label: string;
  names: string[];
  risk: number;
  /** Chance de ter cada garantia. */
  veiculo: number;
  equipamento: number;
  recebiveis: number;
}

export const segments: Segment[] = [
  {
    label: 'Padaria',
    names: ['Pão de Ouro', 'Pão Nosso', 'Trigo Bom', 'Santa Massa'],
    risk: 0,
    veiculo: 0.2,
    equipamento: 0.8,
    recebiveis: 0.8,
  },
  {
    label: 'Oficina',
    names: ['Auto Center Irmãos', 'Mecânica Pistão', 'Oficina do Trevo'],
    risk: 0.03,
    veiculo: 0.5,
    equipamento: 0.6,
    recebiveis: 0.4,
  },
  {
    label: 'Salão de beleza',
    names: ['Studio Bella', 'Espaço Charme', 'Salão Divas'],
    risk: 0.05,
    veiculo: 0.1,
    equipamento: 0.4,
    recebiveis: 0.8,
  },
  {
    label: 'Mercadinho',
    names: ['Mercadinho Bom Preço', 'Mini Box Avenida', 'Mercearia Central'],
    risk: 0,
    veiculo: 0.4,
    equipamento: 0.5,
    recebiveis: 0.9,
  },
  {
    label: 'Lanchonete',
    names: ['Ponto Certo Lanches', 'Point do Açaí', 'Pastelaria Estrela'],
    risk: 0.06,
    veiculo: 0.2,
    equipamento: 0.7,
    recebiveis: 0.8,
  },
  {
    label: 'Confecção',
    names: ['Ateliê Linha Fina', 'Confecções Aurora'],
    risk: 0.04,
    veiculo: 0.2,
    equipamento: 0.7,
    recebiveis: 0.3,
  },
  {
    label: 'Borracharia',
    names: ['Borracharia 24 Horas', 'Pneu Forte'],
    risk: 0.05,
    veiculo: 0.6,
    equipamento: 0.5,
    recebiveis: 0.3,
  },
  {
    label: 'Fretes',
    names: ['Fretes Rápido Norte', 'Mudanças Expresso'],
    risk: 0.04,
    veiculo: 0.9,
    equipamento: 0.1,
    recebiveis: 0.2,
  },
  {
    label: 'Material de construção',
    names: ['Depósito Tijolão', 'Casa do Construtor'],
    risk: -0.02,
    veiculo: 0.6,
    equipamento: 0.3,
    recebiveis: 0.7,
  },
  {
    label: 'Pet shop',
    names: ['Pet Feliz', 'Mundo Pet'],
    risk: 0.03,
    veiculo: 0.2,
    equipamento: 0.3,
    recebiveis: 0.8,
  },
];

export interface EscReason {
  text: string;
  risk: number;
}

export const escReasons: EscReason[] = [
  { text: 'Capital de giro para o fim do ano.', risk: 0 },
  { text: 'Estoque para a Black Friday.', risk: 0.02 },
  { text: 'Máquina nova. A velha não dá conta.', risk: -0.03 },
  { text: 'A folha de pagamento venceu antes do cliente pagar.', risk: 0.12 },
  { text: 'Cliente grande atrasou o pagamento.', risk: 0.06 },
  { text: 'Reformar a fachada.', risk: -0.02 },
  { text: 'Quitar o cheque especial do banco.', risk: 0.15 },
  { text: 'Abrir uma segunda loja.', risk: 0.05 },
  { text: 'Imposto atrasado. A Receita mandou carta.', risk: 0.1 },
  { text: 'Trocar o carro da entrega.', risk: -0.02 },
  { text: 'O banco cortou o limite.', risk: 0.08 },
  { text: 'O aluguel do ponto subiu.', risk: 0.06 },
];

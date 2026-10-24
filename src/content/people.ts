// Nomes, profissões e motivos dos pedidos. Tudo fictício.
// risk: ajuste no risco oculto do devedor. amount: faixa do pedido, em reais.

export const firstNames = {
  m: [
    'Jorge',
    'Antônio',
    'Francisco',
    'Carlos',
    'Paulo',
    'Marcos',
    'Luiz',
    'Raimundo',
    'Sebastião',
    'José',
    'Edson',
    'Valdir',
    'Cícero',
    'Rafael',
    'Diego',
    'Wellington',
    'Anderson',
    'Jefferson',
    'Gilmar',
    'Reginaldo',
    'Josué',
    'Cleiton',
    'Matheus',
    'Davi',
  ],
  f: [
    'Cida',
    'Lúcia',
    'Rosa',
    'Fátima',
    'Neide',
    'Marlene',
    'Sônia',
    'Tereza',
    'Graça',
    'Irene',
    'Joana',
    'Vera',
    'Kelly',
    'Jéssica',
    'Patrícia',
    'Rosângela',
    'Daiane',
    'Simone',
    'Bruna',
    'Elaine',
    'Francisca',
    'Edileuza',
    'Tainá',
    'Larissa',
  ],
} as const;

export const surnames = [
  'Silva',
  'Santos',
  'Oliveira',
  'Souza',
  'Pereira',
  'Lima',
  'Carvalho',
  'Ferreira',
  'Rodrigues',
  'Almeida',
  'Nascimento',
  'Araújo',
  'Ribeiro',
  'Barbosa',
  'Moura',
  'Cavalcante',
  'Teixeira',
  'Batista',
  'Freitas',
  'Nogueira',
  'Rocha',
  'Macedo',
];

/** Chance de o devedor ser chamado de "Seu" / "Dona". */
export const titleChance = 0.45;
export const titles = { m: 'Seu', f: 'Dona' } as const;

export interface Profession {
  name: { m: string; f: string };
  risk: number;
  /** Chance de ter moto, se diferente da padrão. */
  moto?: number;
  /** Recebe benefício do INSS. */
  inss?: boolean;
}

export const professions: Profession[] = [
  { name: { m: 'pedreiro', f: 'diarista' }, risk: 0.05 },
  { name: { m: 'motorista de aplicativo', f: 'motorista de aplicativo' }, risk: 0.08, moto: 0.05 },
  { name: { m: 'entregador', f: 'entregadora' }, risk: 0.1, moto: 0.9 },
  { name: { m: 'camelô', f: 'camelô' }, risk: 0.08 },
  { name: { m: 'dono de bar', f: 'dona de bar' }, risk: 0.04 },
  { name: { m: 'cabeleireiro', f: 'cabeleireira' }, risk: 0.0 },
  { name: { m: 'aposentado', f: 'aposentada' }, risk: -0.12, moto: 0.05, inss: true },
  { name: { m: 'servidor da prefeitura', f: 'servidora da prefeitura' }, risk: -0.15 },
  { name: { m: 'vigia', f: 'merendeira' }, risk: -0.05 },
  { name: { m: 'desempregado', f: 'desempregada' }, risk: 0.25 },
  { name: { m: 'mecânico', f: 'manicure' }, risk: 0.02 },
  { name: { m: 'feirante', f: 'feirante' }, risk: 0.03 },
];

export interface Reason {
  text: string;
  risk: number;
  amount: [number, number];
}

export const reasons: Reason[] = [
  { text: 'Conta de luz atrasada.', risk: 0.05, amount: [300, 900] },
  { text: 'Remédio da mãe.', risk: 0.0, amount: [300, 1_200] },
  { text: 'Aluguel vence sexta.', risk: 0.08, amount: [800, 2_000] },
  { text: 'Moto quebrou. Sem moto, sem entrega.', risk: 0.02, amount: [1_000, 3_000] },
  { text: 'Mercadoria para revender.', risk: -0.05, amount: [1_500, 5_000] },
  { text: 'Reforma do banheiro.', risk: -0.08, amount: [2_000, 6_000] },
  { text: 'Festa de 15 anos da filha.', risk: 0.06, amount: [2_000, 5_000] },
  { text: 'Pagar outro agiota.', risk: 0.3, amount: [1_000, 4_000] },
  { text: 'Fiança de um parente.', risk: 0.2, amount: [2_000, 6_000] },
  { text: 'Enterro do pai.', risk: 0.04, amount: [1_500, 4_000] },
  { text: 'Dentista. Não dá mais para esperar.', risk: -0.02, amount: [600, 2_500] },
  { text: 'Nome sujo. Banco não empresta.', risk: 0.15, amount: [500, 3_000] },
  { text: 'Aposta que "não tinha como perder".', risk: 0.35, amount: [500, 2_500] },
  { text: 'Material escolar das crianças.', risk: 0.0, amount: [300, 1_000] },
  { text: 'Freezer para o bar.', risk: -0.06, amount: [2_500, 5_000] },
];

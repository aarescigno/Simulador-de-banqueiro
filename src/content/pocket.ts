// O laranja da partida: uma pessoa fixa, escolhida pela semente.
export interface Laranja {
  /** Como o texto fala: "seu cunhado Wesley". */
  name: string;
  /** Como o jornal chama: "Wesley". */
  short: string;
  /** "dele" ou "dela". */
  his: 'dele' | 'dela';
}

export const laranjas: readonly Laranja[] = [
  { name: 'seu cunhado Wesley', short: 'Wesley', his: 'dele' },
  { name: 'sua tia Zuleide', short: 'Tia Zuleide', his: 'dela' },
  { name: 'o Juninho da oficina', short: 'Juninho', his: 'dele' },
  { name: 'sua comadre Rose', short: 'Rose', his: 'dela' },
];

export function laranjaFor(seed: number): Laranja {
  return laranjas[(seed >>> 0) % laranjas.length]!;
}

// mulberry32: gerador pequeno, rápido e com estado de 32 bits serializável.
export interface Rng {
  /** Número em [0, 1). */
  next(): number;
  /** Inteiro em [min, max], inclusive. */
  int(min: number, max: number): number;
  chance(p: number): boolean;
  pick<T>(items: readonly T[]): T;
  /** Estado atual, para gravar no save. */
  state(): number;
}

export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    chance: (p) => next() < p,
    pick: (items) => {
      if (items.length === 0) throw new Error('pick: lista vazia');
      return items[Math.floor(next() * items.length)]!;
    },
    state: () => a,
  };
}

/** Semente a partir de um texto ou número digitado pelo jogador. */
export function seedFrom(input: string | number): number {
  if (typeof input === 'number') return input >>> 0;
  const trimmed = input.trim();
  if (/^\d+$/.test(trimmed)) return Number(trimmed) >>> 0;
  let h = 2166136261;
  for (let i = 0; i < trimmed.length; i++) {
    h ^= trimmed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

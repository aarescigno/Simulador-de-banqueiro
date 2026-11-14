/** FNV-1a de 32 bits: variação visual determinística, fora do RNG do motor. */
export function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Escolhe um índice 0..n-1 para um aspecto (`salt`) do nome. */
export function pick(name: string, salt: string, n: number): number {
  return hash(`${salt}|${name}`) % n;
}

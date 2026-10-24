// Formatação de valores para o jogador: R$ 350, R$ 20 mil, R$ 23,4 mil, R$ 1,2 bi.
const scales: [number, string][] = [
  [1e12, 'tri'],
  [1e9, 'bi'],
  [1e6, 'mi'],
  [1e3, 'mil'],
];

function decimal(n: number): string {
  const fixed = n >= 100 ? Math.round(n).toString() : (Math.round(n * 10) / 10).toString();
  return fixed.replace('.', ',');
}

export function money(value: number): string {
  const sign = value < 0 ? '−' : '';
  const abs = Math.abs(Math.round(value));
  for (const [size, unit] of scales) {
    // Acima de 100 na escala arredonda para inteiro: 999.600 vira "R$ 1 mi", não "R$ 1000 mil".
    if (abs >= size * 0.9995) {
      return `${sign}R$ ${decimal(abs / size)} ${unit}`;
    }
  }
  return `${sign}R$ ${abs}`;
}

export function percent(value: number): string {
  return `${decimal(value)}%`;
}

interface SparkProps {
  values: number[];
}

/** Sparkline seca do caixa: polyline verde, área tênue, ponto final brilhando. */
export function Spark({ values }: SparkProps) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * 100;
    const y = 21 - ((v - min) / span) * 18;
    return [x, y] as const;
  });
  const line = pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
  const last = pts[pts.length - 1]!;
  return (
    <div class="spark" aria-hidden="true">
      <svg viewBox="0 0 100 24" preserveAspectRatio="none">
        <polygon class="spark-area" points={`0,24 ${line} 100,24`} />
        <polyline class="spark-line" points={line} pathLength={1} />
      </svg>
      <span class="spark-dot" style={{ left: `${last[0]}%`, top: `${(last[1] / 24) * 100}%` }} />
    </div>
  );
}

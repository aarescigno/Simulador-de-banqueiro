import { useEffect, useRef, useState } from 'preact/hooks';
import { money } from '../../content/format';
import { reducedMotion } from './motion';

/** Valor inteiro que rola do anterior até o novo com ease-out. */
export function useCountUp(value: number, ms = 450, fromZero = false): number {
  const [shown, setShown] = useState(fromZero && !reducedMotion() ? 0 : value);
  const shownRef = useRef(shown);
  shownRef.current = shown;

  useEffect(() => {
    const from = shownRef.current;
    if (from === value) return;
    if (reducedMotion()) {
      setShown(value);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const run = (now: number) => {
      const p = Math.min(1, (now - t0) / ms);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(from + (value - from) * eased));
      if (p < 1) raf = requestAnimationFrame(run);
    };
    raf = requestAnimationFrame(run);
    return () => cancelAnimationFrame(raf);
  }, [value, ms]);

  return shown;
}

interface NumProps {
  value: number;
  format?: (n: number) => string;
  class?: string;
  /** Lampejo verde/vermelho quando o valor sobe/cai. */
  flash?: boolean;
  /** Mostra a variação flutuando junto ao número (o contêiner vira `position: relative`). */
  delta?: boolean;
  fromZero?: boolean;
}

export function Num({
  value,
  format = String,
  class: cls = '',
  flash = true,
  delta = false,
  fromZero = false,
}: NumProps) {
  const shown = useCountUp(value, 450, fromZero);
  const prev = useRef(value);
  const [change, setChange] = useState<{ d: number; n: number } | null>(null);

  useEffect(() => {
    const d = value - prev.current;
    prev.current = value;
    if (d === 0) return;
    setChange((c) => ({ d, n: (c?.n ?? 0) + 1 }));
    const t = setTimeout(() => setChange(null), 900);
    return () => clearTimeout(t);
  }, [value]);

  const flashCls = flash && change ? (change.d > 0 ? 'num-up' : 'num-down') : '';
  return (
    <span class={`num ${cls} ${flashCls}`.trim()}>
      {format(shown)}
      {delta && change && <Delta key={change.n} value={change.d} format={money} />}
    </span>
  );
}

/** Variação pequena que sobe e some; posicionada em absoluto no contêiner. */
export function Delta({
  value,
  format = money,
}: {
  value: number;
  format?: (n: number) => string;
}) {
  const text = value > 0 ? `+${format(value)}` : format(value);
  return (
    <span class={`num-delta mono ${value > 0 ? 'green' : 'red'}`} aria-hidden="true">
      {text}
    </span>
  );
}

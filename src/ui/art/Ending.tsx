import type { JSX } from 'preact';
import { ui } from '../../content/ui';
import type { Ending } from '../../engine';

const P = (d: string) => <path class="art-p" pathLength="1" d={d} />;

function Preso() {
  return (
    <>
      {P('M20 94 H140')}
      {P('M56 10 H104 V58 H56 Z')}
      {P('M68 10 V58 M80 10 V58 M92 10 V58')}
      {P('M50 58 H110 M50 58 V63 M110 58 V63')}
      {P('M44 76 H116 V82 H44 Z')}
      {P('M52 82 V94 M108 82 V94')}
    </>
  );
}

function Morto() {
  return (
    <>
      {P('M24 92 H140')}
      {P('M62 18 H98 V52 H62 Z')}
      {P('M67 26 H93 M67 33 H93 M67 40 H93')}
      {P('M62 52 V56 M98 52 V56')}
      {P('M58 56 H102 L106 66 H54 Z')}
      {P('M60 66 L56 92 M100 66 L104 92 M72 66 L70 88 M88 66 L90 88')}
      {P('M70 58 H92 L95 64 H67 Z M72 58 L69.5 64')}
      {P('M118 92 H138 M123 92 V66 H133 V92 M128 66 V62')}
      <path
        class="art-p art-smoke"
        pathLength="1"
        d="M128 62 C126 58 130 56 128 52 C126 48 129 46 128 43"
      />
    </>
  );
}

function Exilado() {
  return (
    <>
      {P('M8 70 H152')}
      {P('M108 70 C112 65 148 65 152 70')}
      {P('M20 78 H56 M80 82 H120 M40 86 H80')}
      {P('M24 56 l6 -1.6 M36 53.4 l6 -1.6 M48 50.2 l6 -1.6 M60 47 l6 -1.6')}
      <g transform="translate(88 36) rotate(-16)">
        {P('M-18 0 C-18 -3 -10 -5 4 -5 C12 -5 18 -2 20 0 C18 2 12 4 4 4 C-10 4 -18 3 -18 0Z')}
        {P('M-2 3 L-10 15 H-6 L6 4')}
        {P('M-2 -5 L-8 -13 H-5 L4 -5')}
        {P('M-16 -3 L-20 -10 H-17 L-11 -4')}
        {P('M-6 -1 h.1 M-1 -1 h.1 M4 -1 h.1')}
      </g>
      {P('M124 68 C124 60 126 52 128 44')}
      {P(
        'M128 44 C120 38 114 42 112 49 M128 44 C126 36 120 34 116 35 M128 44 C132 36 138 36 142 40 M128 44 C136 40 142 44 144 51',
      )}
      {P('M141 68 C140 62 138 58 136 54')}
      {P(
        'M136 54 C130 50 126 53 125 58 M136 54 C136 48 140 46 144 47 M136 54 C140 52 146 54 147 59',
      )}
    </>
  );
}

function Aposentado() {
  const sun = (a: number, r: number) =>
    `${(134 + r * Math.cos(a)).toFixed(1)} ${(58 + r * Math.sin(a)).toFixed(1)}`;
  const rays = [-170, -140, -110, -80, -50, -20]
    .map((deg) => {
      const a = (deg * Math.PI) / 180;
      return `M${sun(a, 17)} L${sun(a, 22)}`;
    })
    .join(' ');
  return (
    <>
      {P('M8 58 H150')}
      {P('M122 58 A12 12 0 0 1 146 58')}
      {P(rays)}
      {P('M114 68 H132 M122 74 H148 M112 80 H138')}
      {P('M10 92 H150')}
      {P('M24 52 A26 18 0 0 1 76 52 M24 52 q6.5 5 13 0 q6.5 5 13 0 q6.5 5 13 0 q6.5 5 13 0')}
      {P('M50 34 L46 92 M50 34 V30')}
      {P('M86 84 L80 66 M77 66 H84 M86 84 H106 M82 75 H100 V84 M106 84 V92 M90 84 L88 92')}
    </>
  );
}

const arts: Record<Ending, () => JSX.Element> = {
  preso: Preso,
  morto: Morto,
  exilado: Exilado,
  aposentado: Aposentado,
};

/** Ilustração do final, no traço do emblema; se desenha ao montar. */
export function EndingArt({ kind }: { kind: Ending }) {
  const Art = arts[kind];
  return (
    <svg
      class={`art-draw art-ending art-ending-${kind}`}
      viewBox="0 0 160 100"
      width="160"
      height="100"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      role="img"
      aria-label={ui.art.endings[kind]}
    >
      <Art />
    </svg>
  );
}

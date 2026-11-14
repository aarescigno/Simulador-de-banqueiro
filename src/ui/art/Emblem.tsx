import { ui } from '../../content/ui';

const TICKS = Array.from({ length: 36 }, (_, i) => {
  const a = (i * Math.PI * 2) / 36;
  const pt = (r: number) =>
    `${(60 + r * Math.cos(a)).toFixed(1)} ${(60 + r * Math.sin(a)).toFixed(1)}`;
  return `M${pt(52)} L${pt(57)}`;
}).join(' ');

/** Brasão da Agiota S.A.: caderno, moeda e selo de cartório. Se desenha ao montar. */
export function Emblem() {
  return (
    <svg
      class="art-draw art-emblem"
      viewBox="0 0 120 120"
      width="112"
      height="112"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      role="img"
      aria-label={ui.art.emblem}
    >
      <defs>
        <clipPath id="art-coin-clip">
          <circle cx="60" cy="54" r="15.5" />
        </clipPath>
      </defs>
      <circle class="art-p" pathLength="1" cx="60" cy="60" r="57" />
      <circle class="art-p" pathLength="1" cx="60" cy="60" r="52" />
      <path class="art-p" pathLength="1" d={TICKS} />
      <path class="art-p" pathLength="1" d="M28 68 L60 74 L92 68 V90 L60 96 L28 90 Z" />
      <path class="art-p" pathLength="1" d="M60 74 V96" />
      <path
        class="art-p"
        pathLength="1"
        d="M57.5 79 a2.5 2.5 0 1 0 5 0 a2.5 2.5 0 1 0 -5 0 M57.5 86 a2.5 2.5 0 1 0 5 0 a2.5 2.5 0 1 0 -5 0 M57.5 93 a2.5 2.5 0 1 0 5 0 a2.5 2.5 0 1 0 -5 0"
      />
      <path class="art-p" pathLength="1" d="M34 80 L54 84 M34 86 L54 90" />
      <path class="art-p" pathLength="1" d="M86 80 L66 84 M86 86 L66 90" />
      <circle class="art-p art-coin" pathLength="1" cx="60" cy="54" r="17" />
      <circle class="art-p" pathLength="1" cx="60" cy="54" r="13.5" />
      <path
        class="art-p"
        pathLength="1"
        d="M65 49 C65 45 55 45 55 49.5 C55 54 65 53.5 65 58.5 C65 63 55 63 55 59 M60 42 V45 M60 63 V66"
      />
      <g clip-path="url(#art-coin-clip)">
        <path class="art-shine" d="M52 36 L40 74" />
      </g>
    </svg>
  );
}

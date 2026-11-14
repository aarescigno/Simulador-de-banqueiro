import { ui } from '../../content/ui';
import { Stamp } from './Stamp';

const P = (d: string) => <path class="art-p" pathLength="1" d={d} />;

/** Fachada da lojinha de rua da ESC, com o carimbo batendo no canto. */
export function Storefront() {
  return (
    <div class="art-front">
      <svg
        class="art-draw art-store"
        viewBox="0 0 160 100"
        width="160"
        height="100"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        role="img"
        aria-label={ui.art.storefront}
      >
        {P('M8 94 H152')}
        {P('M20 94 V26 H140 V94')}
        {P('M16 26 H144')}
        {P('M34 32 H126 V50 H34 Z')}
        {P('M32 53 H114 M36 53 V74 M112 53 V74 M36 74 H112')}
        {P('M36 60 H112 M36 67 H112')}
        {P('M68 74 H80')}
        {P('M36 74 V94 M112 74 V94')}
        {P('M46 90 H102 M52 90 V82 H60 V90 M68 90 V78 H76 V90 M84 90 V84 H96 V90')}
        {P('M118 94 L120 82 H134 L136 94')}
        {P('M127 82 V62 M127 82 C127 72 122 68 117 66 M127 82 C127 72 132 68 138 66')}
      </svg>
      <Stamp class="art-front-stamp" text={ui.art.stamps.cnpj} tone="green" delay={600} />
    </div>
  );
}

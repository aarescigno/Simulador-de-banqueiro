import { ui } from '../../content/ui';

export type EmptyKind = 'requests' | 'loans' | 'journal';

function Requests() {
  return (
    <>
      <path d="M4 58 H92" />
      <path d="M13 38 L10 58 M39 38 L42 58 M20 40 L19 58 M32 40 L33 58 M11 48 Q26 53 41 48" />
      <ellipse cx="26" cy="36" rx="15" ry="4.5" />
      <path d="M56 6 H88 V58 M56 6 V58" />
      <path d="M62 9 V57 M67 9 V57 M72 9 V57 M77 9 V57 M82 9 V57" stroke-opacity="0.35" />
      <g class="art-sway">
        <path d="M56 6 L74 11 V55 L56 58 Z" />
        <circle cx="71" cy="34" r="1.3" />
      </g>
    </>
  );
}

function Loans() {
  return (
    <>
      <path d="M30 6 H68 V58 H30 Z" />
      <path d="M27 12 H34 M27 20 H34 M27 28 H34 M27 36 H34 M27 44 H34 M27 52 H34" />
      <path d="M40 18 H62 M40 26 H62 M40 34 H62 M40 42 H62" stroke-opacity="0.35" />
      <g class="art-pen">
        <path d="M62 56 L64.3 48.1 L82.4 15.1 L85.6 16.9 L67.5 49.9 Z" fill="var(--bg)" />
        <path d="M65.5 52 L68 50.5 M80.5 17.5 L79 24" />
      </g>
    </>
  );
}

function Journal() {
  return (
    <>
      <path d="M18 4 H86 V52" />
      <path d="M14 8 H82 V56 H14 Z" fill="var(--bg)" />
      <path d="M20 14 H76 M20 18 H76 M20 23 H62 M20 27 H50" />
      <path d="M14 32 H82" stroke-dasharray="3 3" />
      <path d="M20 39 H46 M20 43 H46 M20 47 H40 M20 51 H44" stroke-opacity="0.6" />
      <path d="M52 37 H76 V51 H52 Z M52 37 L76 51 M76 37 L52 51" stroke-opacity="0.6" />
    </>
  );
}

const draw = { requests: Requests, loans: Loans, journal: Journal };

/** Estado vazio: desenho pequeno em --dim, acima do texto que já existe. */
export function Empty({ kind }: { kind: EmptyKind }) {
  const Art = draw[kind];
  return (
    <div class="art-empty">
      <svg
        viewBox="0 0 96 64"
        width="96"
        height="64"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        role="img"
        aria-label={ui.art.empty[kind]}
      >
        <Art />
      </svg>
    </div>
  );
}

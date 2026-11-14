import { ui } from '../../content/ui';
import { pick } from './hash';
import type { Tone } from './Stamp';

const HEADS = [
  { d: 'M12 16 C12 9 15.5 6.5 20 6.5 S28 9 28 16 C28 22 24.5 27.5 20 27.5 S12 22 12 16Z', ear: 12 },
  {
    d: 'M10.5 17 C10.5 10 14.5 7 20 7 S29.5 10 29.5 17 C29.5 23 25.5 27 20 27 S10.5 23 10.5 17Z',
    ear: 10.5,
  },
  {
    d: 'M11.5 14 C11.5 9 15 6.5 20 6.5 S28.5 9 28.5 14 L28.5 20 C28.5 25 25 27.5 20 27.5 S11.5 25 11.5 20Z',
    ear: 11.5,
  },
];

const BROWS = [
  'M13.5 13.6 H18 M22 13.6 H26.5',
  'M13.5 14 Q16 12 18.2 13.6 M21.8 13.6 Q24 12 26.5 14',
  'M13.5 13 L18 13.8 M26.5 13 L22 13.8',
];
const MOUTHS = ['M17.5 25 H22.5', 'M17 25.3 Q20 24 23 25.3', 'M18 25 H22'];

const CAP = 'M11 15 C10 8 14.5 4.5 20 4.5 S30 8 29 15 C27 11.5 24 10 20 10 C16 10 13 11.5 11 15Z';

type Hair = 'bald' | 'short' | 'part' | 'long' | 'bun';
type Detail = 'none' | 'glasses' | 'mustache' | 'cap' | 'earring';
const HAIRS: Hair[] = ['bald', 'short', 'part', 'long', 'bun'];
const DETAILS: Detail[] = ['none', 'glasses', 'mustache', 'cap', 'earring'];

/** Retrato 3x4 em traço, gerado do nome. Sem expressão: foto de documento. */
export function FaceArt({ name }: { name: string }) {
  const head = HEADS[pick(name, 'head', HEADS.length)]!;
  const hair = HAIRS[pick(name, 'hair', HAIRS.length)]!;
  const detail = DETAILS[pick(name, 'detail', DETAILS.length)]!;
  const brow = BROWS[pick(name, 'brow', BROWS.length)]!;
  const mouth = MOUTHS[pick(name, 'mouth', MOUTHS.length)]!;
  const capOn = detail === 'cap';
  const e = head.ear;
  return (
    <svg
      viewBox="0 0 40 40"
      width="40"
      height="40"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M17 27 V30 M23 27 V30 M5 40 C5 33 11 31 17 30 L20 34 L23 30 C29 31 35 33 35 40" />
      <path
        d={`M${e} 15 C${e - 2.4} 15 ${e - 2.4} 20 ${e} 20 M${40 - e} 15 C${40 - e + 2.4} 15 ${40 - e + 2.4} 20 ${40 - e} 20`}
      />
      <path d={head.d} />
      {hair === 'long' && <path d="M11 15 C9.5 21 9.5 27 11 33 M29 15 C30.5 21 30.5 27 29 33" />}
      {!capOn && hair !== 'bald' && <path d={CAP} />}
      {!capOn && hair === 'part' && <path d="M15.5 5.2 C16.5 8 19 9.8 23.5 10.2" />}
      {!capOn && hair === 'bun' && <circle cx="20" cy="2.8" r="2.4" />}
      <path d={brow} />
      <path d="M15.8 17 h.1 M24.2 17 h.1" />
      <path d="M20 18 V21 H21.3" />
      <path d={mouth} />
      {detail === 'glasses' && (
        <path d="M12.8 17 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0 M21.2 17 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0 M18.8 17 H21.2" />
      )}
      {detail === 'mustache' && (
        <path d="M15 22.8 C16.5 20.8 19 21.2 20 22.2 C21 21.2 23.5 20.8 25 22.8 C23 23.6 21 23.2 20 23 C19 23.2 17 23.6 15 22.8Z" />
      )}
      {capOn && <path d="M11 11 C11 5 14.5 2.5 20 2.5 S29 5 29 11 M8.5 11.2 Q20 13.8 31.5 11.2" />}
      {detail === 'earring' && <circle cx={e - 1} cy="21.6" r="1.1" />}
    </svg>
  );
}

interface Props {
  debtor: { name: string; short: string };
  tone: Tone;
}

/** Avatar do devedor: retrato com anel de status. */
export function Face({ debtor, tone }: Props) {
  return (
    <span
      class={`avatar art-face art-tone-${tone}`}
      role="img"
      aria-label={ui.art.face(debtor.short)}
    >
      <FaceArt name={debtor.name} />
    </span>
  );
}

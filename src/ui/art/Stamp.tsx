export type Tone = 'green' | 'amber' | 'red' | 'dim';

interface Props {
  text: string;
  tone: Tone;
  /** Atraso da batida, em ms. */
  delay?: number;
  /** Quando o texto já aparece em outro lugar, esconde do leitor de tela. */
  decorative?: boolean;
  class?: string;
}

/** Carimbo de borracha: borda dupla, mono maiúsculo, inclinado, com falha de tinta. */
export function Stamp({ text, tone, delay = 0, decorative, class: cls }: Props) {
  return (
    <span
      class={`art-stamp art-tone-${tone} ${cls ?? ''}`}
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
      aria-hidden={decorative ? 'true' : undefined}
    >
      {text}
    </span>
  );
}

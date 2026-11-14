import { ui } from '../../content/ui';

interface Props {
  total: number;
  paid: number;
  missed: number;
}

/** Régua de parcelas: pagas em verde, a próxima em âmbar/vermelho se há atraso. */
export function Installments({ total, paid, missed }: Props) {
  const late = missed > 0 ? (missed >= 2 ? 'red' : 'amber') : null;
  return (
    <div class="art-inst" role="img" aria-label={ui.art.installments(paid, total, missed)}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          class={`art-inst-seg ${i < paid ? 'paid' : ''} ${i === paid && late ? `late-${late}` : ''}`}
        />
      ))}
    </div>
  );
}

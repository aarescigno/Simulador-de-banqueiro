import { decide, type Dilemma, type DilemmaOption, type GameState } from '../engine';
import { money } from '../content/format';
import { police } from '../content/params';
import { ui } from '../content/ui';

interface Props {
  dilemma: Dilemma;
  state: GameState;
  update: (s: GameState) => void;
}

const order: DilemmaOption[] = ['pagar', 'advogado', 'correr'];

function optionText(option: DilemmaOption): string {
  const o = ui.dilemma.options;
  if (option === 'pagar') return o.pagar.text;
  return o[option].text(police.inquiry.weeks);
}

export function DilemmaCard({ dilemma, state, update }: Props) {
  return (
    <article class="card dilemma stack">
      <h3 class="amber">{ui.dilemma.title}</h3>
      <p>{ui.dilemma.body}</p>
      {order.map((option) => {
        const cost = dilemma.costs[option];
        const label = ui.dilemma.options[option].label;
        const afford = cost <= state.cash;
        return (
          <div key={option} class="stack tight">
            <button
              class="btn wide"
              disabled={!afford}
              onClick={() =>
                update(decide(state, { type: 'choose', dilemmaId: dilemma.id, option }))
              }
            >
              {cost > 0 ? `${label} · ${money(cost)}` : label}
            </button>
            <span class="small dim">{afford ? optionText(option) : ui.dilemma.noCash}</span>
          </div>
        );
      })}
    </article>
  );
}

import { decide, type Dilemma, type GameState } from '../engine';
import { money } from '../content/format';
import { dilemmaTexts, type TextCtx } from '../content/incidents';
import { ui } from '../content/ui';

interface Props {
  dilemma: Dilemma;
  state: GameState;
  update: (s: GameState) => void;
}

export function DilemmaCard({ dilemma, state, update }: Props) {
  const text = dilemmaTexts[dilemma.kind];
  if (!text) return null;
  const loan = state.loans.find((l) => l.id === dilemma.loanId);
  const ctx: TextCtx = { name: loan?.debtor.short, amount: dilemma.amount };
  return (
    <article class="card dilemma stack">
      <h3 class="amber">{text.title(ctx)}</h3>
      <p>{text.body(ctx)}</p>
      {Object.entries(text.options).map(([option, o]) => {
        const cost = dilemma.costs[option];
        if (cost === undefined) return null;
        // O preço da opção, quando existe, vale como valor do texto (acordo, pagar o jurado).
        const octx: TextCtx = cost > 0 ? { ...ctx, amount: cost } : ctx;
        const label = o.label(octx);
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
              {o.showCost && cost > 0 ? `${label} · ${money(cost)}` : label}
            </button>
            <span class="small dim">{afford ? o.hint?.(octx) : ui.dilemma.noCash}</span>
          </div>
        );
      })}
    </article>
  );
}

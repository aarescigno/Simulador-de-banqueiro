import { step } from '../../engine';
import { money } from '../../content/format';
import { reportLines } from '../../content/journal';
import { ui } from '../../content/ui';
import type { TabProps } from '../Game';

export function Summary({ state, update }: TabProps) {
  const last = state.journal[state.journal.length - 1];
  return (
    <div class="stack">
      <div class="stats">
        <Stat label={ui.summary.cash} value={money(state.cash)} />
      </div>
      <div class="clipping">
        <h3>{ui.summary.headline}</h3>
        {last ? (
          reportLines(last).map((l, i) => <p key={i}>{l}</p>)
        ) : (
          <p class="dim">{ui.summary.noHeadline}</p>
        )}
      </div>
      <button class="btn primary wide" onClick={() => update(step(state).state)}>
        {ui.summary.advance}
      </button>
    </div>
  );
}

export function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div class="stat">
      <span class="dim small">{label}</span>
      <span class={`mono big ${tone ?? ''}`}>{value}</span>
    </div>
  );
}

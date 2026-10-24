import { receivable, step } from '../../engine';
import { money } from '../../content/format';
import { reportLines } from '../../content/journal';
import { ui } from '../../content/ui';
import type { TabProps } from '../Game';

export function Summary({ state, update, goTo }: TabProps) {
  const last = state.journal[state.journal.length - 1];
  const active = state.loans.filter((l) => l.status === 'active');
  const late = active.filter((l) => l.missedStreak > 0).length;

  return (
    <div class="stack">
      <div class="stats">
        <Stat label={ui.summary.cash} value={money(state.cash)} tone="green" />
        <Stat label={ui.summary.receivable} value={money(receivable(state))} />
        <Stat label={ui.summary.debtors} value={String(active.length)} />
        <Stat label={ui.summary.late} value={String(late)} tone={late ? 'amber' : ''} />
        <Stat label={ui.summary.lent} value={money(state.stats.lent)} />
        <Stat
          label={ui.summary.writtenOff}
          value={money(state.stats.writtenOff)}
          tone={state.stats.writtenOff ? 'red' : ''}
        />
      </div>

      {state.requests.length > 0 && (
        <button class="btn wide amber-btn" onClick={() => goTo('portfolio')}>
          {ui.summary.waiting(state.requests.length)} {ui.summary.seeRequests}
        </button>
      )}

      <div class="clipping">
        <h3>{last ? `${ui.summary.headline} · ${last.week}` : ui.summary.headline}</h3>
        {last ? (
          reportLines(last).map((l, i) => <p key={i}>{l}</p>)
        ) : (
          <p>{ui.summary.noHeadline}</p>
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

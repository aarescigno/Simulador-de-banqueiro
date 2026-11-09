import { heatBand, bandRank, protectedWealth, receivable, step, type HeatBand } from '../../engine';
import { DilemmaCard } from '../DilemmaCard';
import { collection } from '../../content/params';
import { money } from '../../content/format';
import { reportLines } from '../../content/journal';
import { ui } from '../../content/ui';
import type { TabProps } from '../Game';

const bandTone: Record<HeatBand, string> = { baixa: 'green', media: 'amber', alta: 'red' };

export function Summary({ state, update, goTo }: TabProps) {
  const last = state.journal[state.journal.length - 1];
  const active = state.loans.filter((l) => l.status === 'active');
  const before = state.journal[state.journal.length - 2];
  const prev = { fear: before?.fear ?? 0, word: before?.word ?? collection.word.start };
  const band = heatBand(state.police.heat);
  const bandBefore = heatBand(before?.heat ?? 0);
  const inquiry = state.police.inquiry;
  const pending = state.dilemmas.length > 0;
  const late = active.filter((l) => l.missedStreak > 0).length;

  return (
    <div class="stack">
      <div class="stats">
        <Stat label={ui.summary.cash} value={money(state.cash)} tone="green" />
        <Stat label={ui.summary.receivable} value={money(receivable(state))} />
        <Stat label={ui.summary.debtors} value={String(active.length)} />
        <Stat label={ui.summary.late} value={String(late)} tone={late ? 'amber' : ''} />
        <Stat label={ui.summary.pocket} value={money(protectedWealth(state))} tone="green" />
        <Stat
          label={ui.summary.writtenOff}
          value={money(state.stats.writtenOff)}
          tone={state.stats.writtenOff ? 'red' : ''}
        />
      </div>

      <div class="meters">
        <Meter
          label={ui.meters.fear.name}
          text={ui.meters.fear.text}
          value={state.fear}
          before={prev.fear}
        />
        <Meter
          label={ui.meters.word.name}
          text={ui.meters.word.text}
          value={state.word}
          before={prev.word}
        />
        <div class="meter">
          <span class="dim small">{ui.meters.heat.name}</span>
          <span class={`mono big ${bandTone[band]}`}>
            {ui.heat[band]}{' '}
            <span class="small dim">
              {bandRank(band) > bandRank(bandBefore)
                ? '▲'
                : bandRank(band) < bandRank(bandBefore)
                  ? '▼'
                  : ''}
            </span>
          </span>
          <span class="dim small">{ui.meters.heat.text}</span>
        </div>
      </div>

      {inquiry && (
        <div class="inquiry-bar small amber">
          {ui.heat.inquiry(inquiry.weeksLeft, inquiry.lawyer)}
        </div>
      )}

      {state.dilemmas.map((d) => (
        <DilemmaCard key={d.id} dilemma={d} state={state} update={update} />
      ))}

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

      <button class="btn primary wide" disabled={pending} onClick={() => update(step(state).state)}>
        {pending ? ui.dilemma.decideFirst : ui.summary.advance}
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

function Meter({
  label,
  text,
  value,
  before,
}: {
  label: string;
  text: string;
  value: number;
  before: number;
}) {
  const delta = Math.round(value) - Math.round(before);
  const arrow = delta > 0 ? '▲' : delta < 0 ? '▼' : '';
  return (
    <div class="meter">
      <span class="dim small">{label}</span>
      <span class="mono big">
        {Math.round(value)} <span class="small dim">{arrow}</span>
      </span>
      <span class="dim small">{text}</span>
    </div>
  );
}

import type { ComponentChildren } from 'preact';
import {
  heatBand,
  bandRank,
  escReady,
  protectedWealth,
  receivable,
  step,
  type HeatBand,
} from '../../engine';
import { DilemmaCard } from '../DilemmaCard';
import { collection } from '../../content/params';
import { money } from '../../content/format';
import { crisisStrip } from '../../content/endings';
import { progressStrip } from '../../content/esc';
import { strips } from '../../content/incidents';
import { reportLines } from '../../content/journal';
import { ui } from '../../content/ui';
import type { TabProps } from '../Game';
import { tick } from '../fx/haptic';
import { Num } from '../fx/Num';
import { Spark } from '../fx/Spark';

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
  const inc = state.incidents;
  const effects = [
    inc.mesada > 0 ? strips.mesada(inc.mesada) : null,
    inc.militia === 'paying' ? strips.militia(inc.militiaRate) : null,
    state.week < inc.rivalUntil ? strips.rival(inc.rivalUntil - 1) : null,
    state.week < inc.primoOutUntil ? strips.primoOut(inc.primoOutUntil - 1) : null,
    state.laundering
      ? progressStrip(
          state.laundering.route,
          state.laundering.readyWeek,
          state.laundering.capital,
          escReady(state),
        )
      : null,
  ].filter((t): t is string => t !== null);
  const cashSeries = [...state.journal.slice(-12).map((j) => j.cash), state.cash];
  const late = active.filter((l) => l.missedStreak > 0).length;

  return (
    <div class="stack">
      {state.dilemmas.map((d) => (
        <DilemmaCard key={d.id} dilemma={d} state={state} update={update} />
      ))}

      <div class="stats">
        <Stat label={ui.summary.cash} value={state.cash} format={money} tone="green" delta>
          <Spark values={cashSeries} />
        </Stat>
        <Stat label={ui.summary.receivable} value={receivable(state)} format={money} />
        <Stat label={ui.summary.debtors} value={active.length} />
        <Stat label={ui.summary.late} value={late} tone={late ? 'amber' : ''} />
        <Stat
          label={ui.summary.pocket}
          value={protectedWealth(state)}
          format={money}
          note={
            state.pocket.blocked > 0
              ? ui.summary.pocketBlocked(money(state.pocket.blocked))
              : undefined
          }
          tone="green"
        />
        <Stat
          label={ui.summary.writtenOff}
          value={state.stats.writtenOff}
          format={money}
          tone={state.stats.writtenOff ? 'red' : ''}
        />
      </div>

      <div class="meters">
        <Meter
          label={ui.meters.fear.name}
          text={ui.meters.fear.text}
          value={state.fear}
          before={prev.fear}
          fear
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
            <span class="small arrow">
              {bandRank(band) > bandRank(bandBefore)
                ? '▲'
                : bandRank(band) < bandRank(bandBefore)
                  ? '▼'
                  : ''}
            </span>
          </span>
          <span class={`leds ${bandTone[band]} lv${bandRank(band) + 1}`} aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span class="dim small">{ui.meters.heat.text}</span>
        </div>
      </div>

      {effects.length > 0 && (
        <div class="strips">
          {effects.map((t) => (
            <span key={t} class="strip small">
              {t}
            </span>
          ))}
        </div>
      )}

      {state.crisis && (
        <div class="inquiry-bar small red red-pulse">
          {crisisStrip(state.crisis.kind, state.crisis.weeksLeft, state.crisis.lawyer)}
        </div>
      )}

      {inquiry && !state.crisis && (
        <div class="inquiry-bar small amber">
          {ui.heat.inquiry(inquiry.weeksLeft, inquiry.lawyer)}
        </div>
      )}

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

      <button
        class={pending ? 'btn primary wide' : 'btn primary wide pulse'}
        disabled={pending}
        onClick={() => {
          tick();
          update(step(state).state);
        }}
      >
        {pending ? ui.dilemma.decideFirst : ui.summary.advance}
      </button>
    </div>
  );
}

export function Stat({
  label,
  value,
  format = String,
  tone,
  note,
  delta,
  children,
}: {
  label: string;
  value: string | number;
  format?: (n: number) => string;
  tone?: string;
  note?: string;
  delta?: boolean;
  children?: ComponentChildren;
}) {
  return (
    <div class="stat">
      <span class="dim small">{label}</span>
      {typeof value === 'number' ? (
        <Num class={`mono big ${tone ?? ''}`} value={value} format={format} delta={delta} />
      ) : (
        <span class={`mono big ${tone ?? ''}`}>{value}</span>
      )}
      {children}
      {note && <span class="small amber">{note}</span>}
    </div>
  );
}

function Meter({
  label,
  text,
  value,
  before,
  fear,
}: {
  fear?: boolean;
  label: string;
  text: string;
  value: number;
  before: number;
}) {
  const delta = Math.round(value) - Math.round(before);
  const arrow = delta > 0 ? '▲' : delta < 0 ? '▼' : '';
  const v = Math.max(0, Math.min(100, value));
  const tone = !fear ? 'green' : v > 75 ? 'red' : v > 50 ? 'amber' : 'green';
  return (
    <div class="meter">
      <span class="dim small">{label}</span>
      <span class="mono big">
        <Num value={Math.round(value)} flash={false} />{' '}
        {arrow && (
          <span class="small arrow" key={arrow + Math.round(value)}>
            {arrow}
          </span>
        )}
      </span>
      <span class="gauge" aria-hidden="true">
        <span class={`gauge-fill ${tone}`} style={{ transform: `scaleX(${v / 100})` }} />
        <span class="gauge-mark" style={{ left: `${Math.max(0, Math.min(100, before))}%` }} />
      </span>
      <span class="dim small">{text}</span>
    </div>
  );
}

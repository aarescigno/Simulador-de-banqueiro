import { collection } from '../../content/params';
import { escUi } from '../../content/escLoans';
import { money } from '../../content/format';
import { reportLines } from '../../content/journal';
import { ui } from '../../content/ui';
import { distributable, escBook, escHeadroom, protectedWealth, step } from '../../engine';
import type { TabProps } from '../Game';
import { tick } from '../fx/haptic';
import { Spark } from '../fx/Spark';
import { Meter, Stat } from '../tabs/Summary';

/** Resumo do degrau 2: caixa, capital, limite, lucro e reputação. */
export function EscSummary({ state, update, goTo }: TabProps) {
  const t = escUi.summary;
  const last = state.journal[state.journal.length - 1];
  const before = state.journal[state.journal.length - 2];
  const active = state.loans.filter((l) => l.status === 'active');
  const late = active.filter((l) => l.missedStreak > 0).length;
  const cashSeries = [...state.journal.slice(-12).map((j) => j.cash), state.cash];
  const esc = state.esc!;
  const free = distributable(state);

  return (
    <div class="stack">
      <div class="stats">
        <Stat label={t.cash} value={state.cash} format={money} tone="green">
          <Spark values={cashSeries} />
        </Stat>
        <Stat label={t.capital} value={esc.capital} format={money} />
        <Stat label={t.headroom} value={escHeadroom(state)} format={money} />
        <Stat label={t.book} value={escBook(state)} format={money} />
        <Stat label={t.late} value={late} tone={late ? 'amber' : ''} />
        <Stat label={t.distributable} value={free} format={money} tone={free ? 'green' : ''} />
        <Stat
          label={t.pocket}
          value={protectedWealth(state)}
          format={money}
          tone="green"
          note={
            state.pocket.blocked > 0
              ? ui.summary.pocketBlocked(money(state.pocket.blocked))
              : undefined
          }
        />
        <Stat
          label={t.writtenOff}
          value={state.stats.writtenOff}
          format={money}
          tone={state.stats.writtenOff ? 'red' : ''}
        />
      </div>

      <div class="meters">
        <Meter
          label={t.word.name}
          text={t.word.text}
          value={state.word}
          before={before?.word ?? collection.word.start}
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

      <button
        class="btn primary wide pulse"
        onClick={() => {
          tick();
          update(step(state).state);
        }}
      >
        {ui.summary.advance}
      </button>
    </div>
  );
}

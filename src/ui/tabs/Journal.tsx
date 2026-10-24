import { reportLines } from '../../content/journal';
import { ui } from '../../content/ui';
import type { TabProps } from '../Game';

export function Journal({ state }: TabProps) {
  const editions = [...state.journal].reverse();
  return (
    <div class="stack">
      <h2>{ui.journal.title}</h2>
      {editions.length === 0 && <p class="dim">{ui.journal.empty}</p>}
      {editions.map((r) => (
        <article key={r.week} class="clipping">
          <h3>{ui.journal.edition(r.week)}</h3>
          {reportLines(r).map((l, i) => (
            <p key={i}>{l}</p>
          ))}
        </article>
      ))}
    </div>
  );
}

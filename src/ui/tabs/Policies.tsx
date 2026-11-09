import { collection } from '../../content/params';
import { ui } from '../../content/ui';
import { decide, type Level } from '../../engine';
import type { TabProps } from '../Game';

const order: Level[] = ['conversa', 'pressao', 'primo'];
const weeks = Array.from({ length: collection.maxThreshold }, (_, i) => i + 1);

export function Policies({ state, update }: TabProps) {
  const current = state.policy.collection;
  const set = (level: Level, value: string) =>
    update(
      decide(state, {
        type: 'setPolicy',
        collection: { ...current, [level]: value === '' ? null : Number(value) },
      }),
    );

  return (
    <div class="stack">
      <h2>{ui.policies.title}</h2>
      <h3>{ui.policies.collection}</h3>
      <p class="dim small">{ui.policies.collectionHint}</p>
      {order.map((level) => (
        <article key={level} class="card stack tight">
          <strong>{ui.levels[level].name}</strong>
          <span class="dim small">{ui.levels[level].text}</span>
          {level === 'primo' && state.primoGone && (
            <span class="amber small">{ui.levels.primoGone}</span>
          )}
          <label class="row between">
            <span class="dim small">{ui.policies.from}</span>
            <select
              class="field select"
              disabled={level === 'primo' && state.primoGone}
              value={current[level] ?? ''}
              onChange={(e) => set(level, e.currentTarget.value)}
            >
              {weeks.map((w) => (
                <option key={w} value={w}>
                  {ui.policies.week(w)}
                </option>
              ))}
              <option value="">{ui.policies.never}</option>
            </select>
          </label>
        </article>
      ))}
    </div>
  );
}

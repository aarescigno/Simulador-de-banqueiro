import { escLoans } from '../../content/params';
import { escUi } from '../../content/escLoans';
import { ui } from '../../content/ui';
import { decide, type EscLevel } from '../../engine';
import type { TabProps } from '../Game';

const order: EscLevel[] = ['aviso', 'serasa', 'execucao'];
const weeks = Array.from({ length: escLoans.collection.maxThreshold }, (_, i) => i + 1);

/** Políticas do degrau 2: a partir de que semana de atraso vale cada passo da cobrança. */
export function EscPolicies({ state, update }: TabProps) {
  const current = state.policy.escCollection;
  const set = (level: EscLevel, value: string) =>
    update(
      decide(state, {
        type: 'setEscPolicy',
        collection: { ...current, [level]: value === '' ? null : Number(value) },
      }),
    );
  const t = escUi.policies;
  return (
    <div class="stack">
      <h2>{t.title}</h2>
      <h3>{t.collection}</h3>
      <p class="dim small">{t.hint}</p>
      {order.map((level) => (
        <article key={level} class="card stack tight">
          <strong>{t.steps[level].name}</strong>
          <span class="dim small">{t.steps[level].text}</span>
          <label class="row between">
            <span class="dim small">{ui.policies.from}</span>
            <select
              class="field select"
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

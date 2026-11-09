import { useState } from 'preact/hooks';
import {
  advanceWeeks,
  allIncidents,
  devForceIncident,
  devForceTrial,
  devGiveMoney,
  exportSave,
  hiddenVariables,
  seedFrom,
  type GameState,
} from '../engine';
import { incidentNames } from '../content/incidents';
import { ui } from '../content/ui';
import { copyText } from './clipboard';

interface Props {
  state: GameState | null;
  update: (s: GameState) => void;
  onNewGame: (seed: number) => void;
  onClose: () => void;
}

export function DevPanel({ state, update, onNewGame, onClose }: Props) {
  const [seed, setSeed] = useState(String(state?.seed ?? ''));
  const [amount, setAmount] = useState('10000');
  const [weeks, setWeeks] = useState('4');
  const [copied, setCopied] = useState(false);
  const [incident, setIncident] = useState<string>(allIncidents[0]!);
  const [forceError, setForceError] = useState('');

  return (
    <div class="overlay" role="dialog" aria-modal="true">
      <div class="sheet stack">
        <h2 class="amber">{ui.dev.title}</h2>

        <label class="small dim">{ui.dev.seed}</label>
        <input class="field" value={seed} onInput={(e) => setSeed(e.currentTarget.value)} />
        <button class="btn" disabled={!seed.trim()} onClick={() => onNewGame(seedFrom(seed))}>
          {ui.dev.newWithSeed}
        </button>

        {state ? (
          <>
            <label class="small dim">{ui.dev.money}</label>
            <div class="row">
              <input
                class="field grow"
                inputMode="numeric"
                value={amount}
                onInput={(e) => setAmount(e.currentTarget.value)}
              />
              <button
                class="btn"
                onClick={() => update(devGiveMoney(state, Math.round(Number(amount) || 0)))}
              >
                {ui.dev.give}
              </button>
            </div>

            <label class="small dim">{ui.dev.weeks}</label>
            <div class="row">
              <input
                class="field grow"
                inputMode="numeric"
                value={weeks}
                onInput={(e) => setWeeks(e.currentTarget.value)}
              />
              <button
                class="btn"
                onClick={() =>
                  update({
                    ...advanceWeeks(state, Math.max(0, Math.min(520, Number(weeks) || 0))),
                    devUsed: true,
                  })
                }
              >
                {ui.dev.advance}
              </button>
            </div>

            <label class="small dim">{ui.dev.forceIncident}</label>
            <div class="row">
              <select
                class="field grow"
                value={incident}
                onChange={(e) => setIncident(e.currentTarget.value)}
              >
                {allIncidents.map((id) => (
                  <option key={id} value={id}>
                    {incidentNames[id]}
                  </option>
                ))}
              </select>
              <button
                class="btn"
                onClick={() => {
                  try {
                    update(devForceIncident(state, incident as (typeof allIncidents)[number]));
                    setForceError('');
                  } catch (e) {
                    setForceError(e instanceof Error ? e.message : String(e));
                  }
                }}
              >
                {ui.dev.force}
              </button>
            </div>
            <button
              class="btn"
              onClick={() => {
                try {
                  update(devForceTrial(state));
                  setForceError('');
                } catch (e) {
                  setForceError(e instanceof Error ? e.message : String(e));
                }
              }}
            >
              {ui.dev.forceTrial}
            </button>
            {forceError && <p class="small red">{forceError}</p>}

            <h3>{ui.dev.hidden}</h3>
            <pre class="code">{JSON.stringify(hiddenVariables(state), null, 1)}</pre>

            <button
              class="btn primary"
              onClick={async () =>
                setCopied(
                  await copyText(
                    ui.dev.report(__APP_VERSION__, state.seed, state.week, exportSave(state)),
                  ),
                )
              }
            >
              {copied ? ui.dev.copied : ui.dev.copyState}
            </button>
          </>
        ) : (
          <p class="dim">{ui.dev.noGame}</p>
        )}

        <button class="btn" onClick={onClose}>
          {ui.dev.close}
        </button>
      </div>
    </div>
  );
}

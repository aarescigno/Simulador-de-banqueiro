import { useState } from 'preact/hooks';
import { exportSave, importSave, SaveError, type GameState } from '../engine';
import { money } from '../content/format';
import { ui } from '../content/ui';
import { copyText } from './clipboard';
import { DevPanel } from './DevPanel';

const DEV_TAPS = 10;

interface Props {
  state: GameState | null;
  onContinue: () => void;
  onNewGame: (seed?: number) => void;
  onLoad: (state: GameState) => void;
  update: (state: GameState) => void;
}

export function Menu({ state, onContinue, onNewGame, onLoad, update }: Props) {
  const [panel, setPanel] = useState<'none' | 'export' | 'import' | 'dev'>('none');
  const [taps, setTaps] = useState(0);

  const tapVersion = () => {
    const n = taps + 1;
    setTaps(n >= DEV_TAPS ? 0 : n);
    if (n >= DEV_TAPS) setPanel('dev');
  };

  return (
    <main class="menu">
      <h1>{ui.title}</h1>
      <p class="dim">{ui.tagline}</p>
      <div class="menu-actions">
        {state && (
          <button class="btn primary wide" onClick={onContinue}>
            {ui.menu.continue}
            <span class="dim small mono">
              {' '}
              · {ui.menu.week(state.week)} · {money(state.cash)}
            </span>
          </button>
        )}
        <button
          class="btn wide"
          onClick={() => {
            if (!state || confirm(ui.menu.confirmNewGame)) onNewGame();
          }}
        >
          {ui.menu.newGame}
        </button>
        {state && (
          <button class="btn wide" onClick={() => setPanel('export')}>
            {ui.menu.exportSave}
          </button>
        )}
        <button class="btn wide" onClick={() => setPanel('import')}>
          {ui.menu.importSave}
        </button>
      </div>
      <p class="version mono" onClick={tapVersion}>
        {ui.version(__APP_VERSION__)}
      </p>
      {panel === 'dev' && (
        <DevPanel
          state={state}
          update={update}
          onNewGame={(seed) => {
            setPanel('none');
            onNewGame(seed);
          }}
          onClose={() => setPanel('none')}
        />
      )}
      {panel === 'export' && state && (
        <ExportPanel text={exportSave(state)} onClose={() => setPanel('none')} />
      )}
      {panel === 'import' && (
        <ImportPanel
          onClose={() => setPanel('none')}
          onLoad={(s) => {
            if (!state || confirm(ui.menu.confirmNewGame)) onLoad(s);
          }}
        />
      )}
    </main>
  );
}

function ExportPanel({ text, onClose }: { text: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <div class="overlay" role="dialog" aria-modal="true">
      <div class="sheet">
        <h2>{ui.menu.exportSave}</h2>
        <p class="dim small">{ui.menu.exportHint}</p>
        <textarea
          class="code"
          readOnly
          rows={6}
          value={text}
          onFocus={(e) => e.currentTarget.select()}
        />
        <div class="row">
          <button class="btn primary" onClick={async () => setCopied(await copyText(text))}>
            {copied ? ui.menu.copied : ui.menu.copy}
          </button>
          <button class="btn" onClick={onClose}>
            {ui.menu.close}
          </button>
        </div>
      </div>
    </div>
  );
}

function ImportPanel({ onClose, onLoad }: { onClose: () => void; onLoad: (s: GameState) => void }) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  return (
    <div class="overlay" role="dialog" aria-modal="true">
      <div class="sheet">
        <h2>{ui.menu.importSave}</h2>
        <p class="dim small">{ui.menu.importHint}</p>
        <textarea
          class="code"
          rows={6}
          value={text}
          onInput={(e) => setText(e.currentTarget.value)}
        />
        {error && <p class="red small">{ui.menu.importError(error)}</p>}
        <div class="row">
          <button
            class="btn primary"
            onClick={() => {
              try {
                onLoad(importSave(text));
              } catch (e) {
                setError(e instanceof SaveError ? e.message : String(e));
              }
            }}
          >
            {ui.menu.load}
          </button>
          <button class="btn" onClick={onClose}>
            {ui.menu.close}
          </button>
        </div>
      </div>
    </div>
  );
}

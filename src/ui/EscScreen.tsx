import { useState } from 'preact/hooks';
import { screen } from '../content/esc';
import { money } from '../content/format';
import { laranjaFor } from '../content/pocket';
import { ui } from '../content/ui';
import { heatBand, protectedWealth, type GameState } from '../engine';
import { Storefront } from './art';
import { ConfirmBar } from './ConfirmBar';

interface Props {
  state: GameState;
  onNewGame: () => void;
}

/** Degrau 2, por enquanto só a fachada: a ESC existe, mas ainda não dá para jogá-la. */
export function EscScreen({ state, onNewGame }: Props) {
  const [ask, setAsk] = useState(false);
  const esc = state.esc!;
  const f = esc.ficha;
  const rows: [string, string][] = [
    [screen.ficha.weeks, String(f.weeks)],
    [screen.ficha.complaints, String(f.complaints)],
    [screen.ficha.raids, String(f.raids)],
    [screen.ficha.bribes, String(f.bribes)],
    [screen.ficha.heat, ui.heat[heatBand(f.heat)]],
    [screen.ficha.primo, f.primoGone ? screen.ficha.primoGone : screen.ficha.primoActive],
    [screen.ficha.mesada, f.mesada ? screen.ficha.mesadaOk : screen.ficha.mesadaNo],
    [screen.ficha.militia, screen.militia[f.militia]],
  ];
  return (
    <main class="end stack">
      <Storefront />
      <h1 class="green">{screen.title}</h1>
      <p>{screen.opening(esc.openedWeek)}</p>
      <p class="dim">{screen.origin(esc.route, laranjaFor(state.seed))}</p>
      <p class="dim">{screen.book(esc.soldLoans, money(esc.sold))}</p>
      {esc.leftover > 0 && <p class="dim">{screen.leftover(money(esc.leftover))}</p>}
      <div class="stats">
        <div class="stat">
          <span class="dim small">{screen.cash}</span>
          <span class="mono green">{money(state.cash)}</span>
        </div>
        <div class="stat">
          <span class="dim small">{screen.protected}</span>
          <span class="mono green">{money(protectedWealth(state))}</span>
        </div>
      </div>
      <h2>{screen.fichaTitle}</h2>
      <ul class="parts">
        {rows.map(([label, value]) => (
          <li key={label} class="row between">
            <span class="dim">{label}</span>
            <span class="mono">{value}</span>
          </li>
        ))}
      </ul>
      <p class="dim">{screen.soon}</p>
      {ask ? (
        <ConfirmBar text={screen.confirmNew} onYes={onNewGame} onNo={() => setAsk(false)} />
      ) : (
        <button class="btn primary wide" onClick={() => setAsk(true)}>
          {screen.newGame}
        </button>
      )}
    </main>
  );
}

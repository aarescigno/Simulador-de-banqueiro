import { laranjaFor } from '../content/pocket';
import { endScreen, endingTexts, partLabels } from '../content/endings';
import { money } from '../content/format';
import type { GameState } from '../engine';
import { EndingArt } from './art';

interface Props {
  state: GameState;
  onNewGame: () => void;
}

/** Tela final, no lugar do jogo quando a partida acabou. */
export function EndScreen({ state, onNewGame }: Props) {
  const ended = state.ended!;
  const text = endingTexts[ended.kind];
  const [what, who] = text.lines(laranjaFor(state.seed).short);
  const parts = ended.parts.filter((p) => p.amount > 0);
  return (
    <main class="end stack">
      <EndingArt kind={ended.kind} />
      <h1 class={ended.kind === 'aposentado' ? 'green' : 'red'}>{text.title}</h1>
      <p>{what}</p>
      <p class="dim">{who}</p>
      <div class="stat">
        <span class="dim small">{endScreen.score}</span>
        <span class="mono score green">{money(ended.score)}</span>
      </div>
      {parts.length > 0 && (
        <ul class="parts art-parts">
          {parts.map((p, i) => (
            <li key={p.part} class="row between art-line" style={{ '--i': i }}>
              <span class="dim">
                {p.part === 'cash' && ended.kind === 'exilado'
                  ? endScreen.cashExile
                  : partLabels[p.part]}
              </span>
              <span class="mono">{money(p.amount)}</span>
            </li>
          ))}
        </ul>
      )}
      <p class="small dim mono">
        {endScreen.stats(
          ended.week,
          money(state.stats.lent),
          money(state.stats.writtenOff),
          state.complaints,
        )}
      </p>
      <button class="btn primary wide" onClick={onNewGame}>
        {endScreen.newGame}
      </button>
    </main>
  );
}

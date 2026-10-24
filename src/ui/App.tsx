import { useState } from 'preact/hooks';
import { newGame, type GameState } from '../engine';
import { ContentWarning } from './ContentWarning';
import { Game } from './Game';
import { Menu } from './Menu';
import { loadGame, markWarningSeen, randomSeed, saveGame, warningSeen } from './storage';
import { UpdatePrompt } from './UpdatePrompt';

export function App() {
  const [state, setState] = useState<GameState | null>(loadGame);
  const [screen, setScreen] = useState<'menu' | 'game'>('menu');
  const [showWarning, setShowWarning] = useState(() => !warningSeen());

  const update = (next: GameState) => {
    saveGame(next);
    setState(next);
  };

  return (
    <>
      {screen === 'game' && state ? (
        <Game state={state} update={update} onMenu={() => setScreen('menu')} />
      ) : (
        <Menu
          state={state}
          update={update}
          onContinue={() => setScreen('game')}
          onNewGame={(seed = randomSeed()) => {
            update(newGame(seed));
            setScreen('game');
          }}
          onLoad={(s) => {
            update(s);
            setScreen('game');
          }}
        />
      )}
      {showWarning && (
        <ContentWarning
          onClose={() => {
            markWarningSeen();
            setShowWarning(false);
          }}
        />
      )}
      <UpdatePrompt />
    </>
  );
}

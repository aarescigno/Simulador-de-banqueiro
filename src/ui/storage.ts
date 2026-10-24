// Persistência no navegador. Tudo em try/catch: modo privado e armazenamento cheio não podem travar o jogo.
import { deserialize, serialize, type GameState } from '../engine';

const SAVE_KEY = 'agiota-sa:save';
const WARNING_KEY = 'agiota-sa:aviso-visto';

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? deserialize(raw) : null;
  } catch {
    return null;
  }
}

export function saveGame(state: GameState): void {
  try {
    localStorage.setItem(SAVE_KEY, serialize(state));
  } catch {
    // sem espaço ou sem permissão: segue sem autosave
  }
}

export function warningSeen(): boolean {
  try {
    return localStorage.getItem(WARNING_KEY) === '1';
  } catch {
    return false;
  }
}

export function markWarningSeen(): void {
  try {
    localStorage.setItem(WARNING_KEY, '1');
  } catch {
    // idem
  }
}

export function randomSeed(): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0]!;
}

import { reducedMotion } from './motion';

/** Vibração curta de toque; silenciosa onde não há suporte ou o sistema pede menos movimento. */
export function tick(): void {
  try {
    if (reducedMotion()) return;
    navigator.vibrate?.(8);
  } catch {
    /* sem vibração */
  }
}

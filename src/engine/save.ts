import { SAVE_VERSION, type GameState } from './state';

const PREFIX = 'AGIOTA-SA:';

type Migration = (old: Record<string, unknown>) => Record<string, unknown>;

/** migrations[n] leva um save da versão n para n + 1. */
const migrations: Record<number, Migration> = {};

export class SaveError extends Error {}

export function serialize(state: GameState): string {
  return JSON.stringify(state);
}

export function deserialize(json: string): GameState {
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(json) as Record<string, unknown>;
  } catch {
    throw new SaveError('Save ilegível.');
  }
  if (typeof data !== 'object' || data === null || typeof data.saveVersion !== 'number') {
    throw new SaveError('Save sem versão.');
  }
  let version = data.saveVersion;
  if (version > SAVE_VERSION) throw new SaveError('Save de uma versão mais nova do jogo.');
  while (version < SAVE_VERSION) {
    const migrate = migrations[version];
    if (!migrate) throw new SaveError(`Sem migração do save ${version}.`);
    data = migrate(data);
    version += 1;
    data.saveVersion = version;
  }
  return data as unknown as GameState;
}

/** Texto para copiar e colar: prefixo + JSON em base64 (UTF-8). */
export function exportSave(state: GameState): string {
  const bytes = new TextEncoder().encode(serialize(state));
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return PREFIX + btoa(binary);
}

export function importSave(text: string): GameState {
  const trimmed = text.trim().replace(/\s+/g, '');
  if (!trimmed.startsWith(PREFIX)) throw new SaveError('Texto não parece um save do jogo.');
  let binary: string;
  try {
    binary = atob(trimmed.slice(PREFIX.length));
  } catch {
    throw new SaveError('Save corrompido.');
  }
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return deserialize(new TextDecoder().decode(bytes));
}

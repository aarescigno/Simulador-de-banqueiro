import { describe, expect, it } from 'vitest';
import { ui } from '../src/content/ui';

describe('conteúdo', () => {
  it('tem título', () => {
    expect(ui.title).toBe('Agiota S.A.');
  });
});

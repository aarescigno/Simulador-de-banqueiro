import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'dev-dist', 'node_modules'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // O motor é puro: sem DOM, sem relógio, sem aleatoriedade fora do RNG do estado.
    files: ['src/engine/**/*.ts'],
    rules: {
      'no-restricted-globals': ['error', 'window', 'document', 'localStorage', 'navigator'],
      'no-restricted-properties': [
        'error',
        { object: 'Math', property: 'random', message: 'Use o RNG do estado.' },
        { object: 'Date', property: 'now', message: 'O motor não lê o relógio.' },
      ],
    },
  },
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
);

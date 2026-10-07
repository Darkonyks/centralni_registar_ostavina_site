import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import jsxA11y from 'eslint-plugin-jsx-a11y-x';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores(['dist', 'dist-ssr', 'dist-server', 'data', 'node_modules']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      jsxA11y.configs.recommended,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // Projektno pravilo: bez native browser dijaloga.
      'no-alert': 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }],
      // Skrolabilni regioni (npr. tekst politike privatnosti) moraju biti dostupni tastaturom.
      'jsx-a11y-x/no-noninteractive-tabindex': [
        'error',
        { tags: [], roles: ['tabpanel', 'region'] },
      ],
    },
  },
  {
    // Kod koji radi u Node-u: API server, zajednička validacija, Vite konfiguracija.
    files: ['server/**/*.ts', 'shared/**/*.ts', 'vite.config.ts'],
    languageOptions: { globals: globals.node },
  },
  {
    // Serverski logger piše strukturisane logove i preko console.info.
    files: ['server/**/*.ts'],
    rules: { 'no-console': ['error', { allow: ['info', 'warn', 'error'] }] },
  },
  {
    files: ['scripts/**/*.{js,mjs}', 'eslint.config.js'],
    extends: [js.configs.recommended],
    languageOptions: { globals: globals.node },
  },
  {
    // Build skripta sme da loguje u terminal.
    files: ['scripts/**/*.{js,mjs}'],
    rules: { 'no-console': 'off' },
  },
  prettier,
]);

// ESLint 9 flat — svelte · ts · prettier · import 경계(boundaries, CLAUDE.md 스택·경계)
import js from '@eslint/js';
import ts from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import prettier from 'eslint-config-prettier';
import boundaries from 'eslint-plugin-boundaries';
import globals from 'globals';
import svelteConfig from './packages/ui/svelte.config.js';

export default ts.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/.svelte-kit/**',
      '**/build/**',
      '**/dist/**',
      '**/generated/**',
      'packages/tokens/**',
      'tools/**',
      '.claude/**',
      'archive/**',
    ],
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  ...svelte.configs.recommended,
  prettier,
  ...svelte.configs.prettier,
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  {
    files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
    languageOptions: { parserOptions: { parser: ts.parser, extraFileExtensions: ['.svelte'], svelteConfig } },
  },
  {
    plugins: { boundaries },
    settings: {
      'boundaries/elements': [
        { type: 'tokens', pattern: 'packages/tokens/**' },
        { type: 'domain', pattern: 'packages/domain/**' },
        { type: 'ui', pattern: 'packages/ui/**' },
        {
          type: 'infra',
          pattern: [
            'packages/api-client/**',
            'packages/realtime/**',
            'packages/offline/**',
            'packages/video/**',
            'packages/map/**',
          ],
        },
        { type: 'mock', pattern: 'packages/mock/**' },
        { type: 'app-web', pattern: 'apps/web/**' },
        { type: 'app-pwa', pattern: 'apps/pwa/**' },
      ],
      'boundaries/dependency-nodes': ['import', 'dynamic-import'],
      'import/resolver': { node: { extensions: ['.js', '.ts', '.svelte'] } },
    },
    rules: {
      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          rules: [
            { from: 'domain', allow: ['tokens'] },
            { from: 'ui', allow: ['tokens', 'domain'] },
            { from: 'infra', allow: ['tokens', 'domain', 'ui'] },
            { from: 'mock', allow: ['tokens', 'domain', 'ui', 'infra'] },
            { from: 'app-web', allow: ['tokens', 'domain', 'ui', 'infra', 'mock'] },
            { from: 'app-pwa', allow: ['tokens', 'domain', 'ui', 'infra', 'mock'] },
          ],
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@boomeyes/web', '@boomeyes/web/*', '@boomeyes/pwa', '@boomeyes/pwa/*'],
              message: 'apps 상호 import 금지 (CLAUDE.md 경계)',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['packages/ui/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [{ group: ['@boomeyes/mock', '@boomeyes/mock/*'], message: 'ui는 mock을 import하지 않는다' }] },
      ],
    },
  },
);

import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'
import prettier from 'eslint-config-prettier/flat'
import importPlugin from 'eslint-plugin-import'

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  {
    files: ['**/*.{js,cjs,mjs,ts,tsx}'],
    plugins: {
      import: importPlugin,
    },
    rules: {
      'arrow-body-style': ['error', 'as-needed'],
      'func-style': ['error', 'expression'],
      'prefer-arrow-callback': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "FunctionExpression:not(MethodDefinition > FunctionExpression):not(Property[method=true] > FunctionExpression):not(Property[kind='get'] > FunctionExpression):not(Property[kind='set'] > FunctionExpression)",
          message:
            'Use an arrow function unless method semantics are required.',
        },
        {
          selector:
            "VariableDeclarator[id.name=/^handle/] > ArrowFunctionExpression[async=false][body.type='BlockStatement'][body.body.length=1] > BlockStatement > ExpressionStatement[expression.type='CallExpression']",
          message: 'Use a concise body for a single-call handler.',
        },
      ],
      'prefer-template': 'error',
      'no-nested-ternary': 'error',
      'no-unneeded-ternary': 'error',
      'import/first': 'error',
      'import/no-duplicates': 'error',
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            ['parent', 'sibling', 'index'],
          ],
          pathGroups: [
            { pattern: '**/*.scss', group: 'index', position: 'after' },
            { pattern: '@/**', group: 'internal' },
          ],
          pathGroupsExcludedImportTypes: ['builtin'],
          distinctGroup: false,
          'newlines-between': 'never',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import/newline-after-import': ['error', { count: 1, exactCount: true }],
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-unused-expressions': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],
    },
  },
  prettier,
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'coverage/**',
    'test-results/**',
    'playwright-report/**',
    '.vercel/**',
    'next-env.d.ts',
    '.agents/**',
    '.specify/**',
    'docs/**',
    'specs/**',
    'tests/spec-kit/**',
  ]),
])

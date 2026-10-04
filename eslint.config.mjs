import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'
import prettier from 'eslint-config-prettier/flat'
import importPlugin from 'eslint-plugin-import'

const parentImport = {
  regex: '^[.][.]/',
  message: 'Use the @/ alias for imports outside the current directory.',
}

const sharedImport = {
  regex: '^(?:@/(?:features|server|app)(?:/|$)|next(?:/|$))',
  message:
    'Shared modules cannot depend on features, app, server, or Next runtime.',
}

const modelImport = {
  regex:
    '^(?:@/(?:server|app|shared/(?:ui|query))(?:/|$)|@/features/[^/]+/(?:ui|application|server)(?:/|$)|@/features/conversation/[^/]+/(?:ui|application|server)(?:/|$)|(?:react|next)(?:/|$)|@tanstack/react-query$)',
  message: 'A pure model may depend only on other models and shared kernel.',
}

const applicationImport = {
  regex:
    '^(?:@/(?:server|app|shared/ui)(?:/|$)|@/features/[^/]+/(?:ui|server)(?:/|$)|@/features/conversation/[^/]+/(?:ui|server)(?:/|$)|next(?:/|$))',
  message: 'Application orchestration cannot import UI or server runtime.',
}

const clientImport = {
  regex:
    '^@/(?:server(?:/|$)|features/[^/]+/server(?:/|$)|features/conversation/[^/]+/server(?:/|$))',
  message: 'Client UI cannot import server runtime or secret-bearing entries.',
}

const serverAdapterImport = {
  regex:
    '^@/features/(?:[^/]+|conversation/[^/]+)/(?:ui|application|server)(?:/|$)',
  message:
    'Server adapters may consume feature models, not feature runtime layers.',
}

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  {
    files: ['**/*.{js,cjs,mjs,ts,mts,tsx}'],
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
        {
          selector:
            'ImportDeclaration[source.value=/\\.(?:scss|css)$/] ~ ImportDeclaration:not([source.value=/\\.(?:scss|css)$/])',
          message: 'Place stylesheet imports after all other imports.',
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
            { pattern: './**/*.{css,scss}', group: 'index', position: 'after' },
            { pattern: '**/*.{css,scss}', group: 'index', position: 'after' },
            {
              pattern: '@/**/{constants,*.constants}',
              group: 'internal',
              position: 'after',
            },
            {
              pattern: '../**/{constants,*.constants}',
              group: 'internal',
              position: 'after',
            },
            {
              pattern: './**/{constants,*.constants}',
              group: 'internal',
              position: 'after',
            },
            {
              pattern: '@/components/**',
              group: 'internal',
              position: 'after',
            },
            { pattern: './**', group: 'internal' },
            { pattern: '../**', group: 'internal' },
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
    files: ['src/**/*.{js,cjs,mjs,ts,mts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [parentImport],
        },
      ],
    },
  },
  {
    files: ['src/shared/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [parentImport, sharedImport] },
      ],
    },
  },
  {
    files: ['src/shared/kernel/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            parentImport,
            sharedImport,
            {
              regex: '^(?:react(?:/|$)|@tanstack/react-query$)',
              message: 'Shared kernel contains no React or Query runtime.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/features/**/model/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [parentImport, modelImport] },
      ],
    },
  },
  {
    files: ['src/features/**/application/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [parentImport, applicationImport] },
      ],
    },
  },
  {
    files: ['src/features/**/ui/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [parentImport, clientImport] },
      ],
    },
  },
  {
    files: ['src/server/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [parentImport, serverAdapterImport] },
      ],
    },
  },
  {
    files: ['**/*.{ts,mts,tsx}'],
    languageOptions: {
      parserOptions: {
        project: [
          './tsconfig.json',
          './tsconfig.vitest.json',
          './tests/fixtures/query-app/tsconfig.json',
        ],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-floating-promises': [
        'error',
        { ignoreVoid: true },
      ],
      '@typescript-eslint/no-misused-promises': 'error',
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
    'tests/fixtures/query-app/.next/**',
    'tests/fixtures/query-app/next-env.d.ts',
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

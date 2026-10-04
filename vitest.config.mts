import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    globals: false,
    isolate: true,
    allowOnly: false,
    retry: 0,
    mockReset: true,
    restoreMocks: true,
    unstubGlobals: true,
    unstubEnvs: true,
    css: true,
    projects: [
      {
        test: {
          name: 'node',
          environment: 'node',
          include: ['tests/unit/**/*.test.ts'],
          setupFiles: ['tests/setup/node.ts'],
        },
      },
      {
        test: {
          name: 'integration',
          environment: 'node',
          include: ['tests/integration/**/*.test.ts'],
          setupFiles: ['tests/setup/node.ts'],
          testTimeout: 30_000,
          expect: { poll: { timeout: 5_000 } },
        },
      },
      {
        test: {
          name: 'dom',
          environment: 'jsdom',
          include: ['tests/component/**/*.test.{ts,tsx}'],
          setupFiles: ['tests/setup/dom.ts'],
        },
      },
    ],
  },
})

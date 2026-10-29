import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['tests/int/**/*.int.spec.ts'],
    // Each database suite starts Payload in its beforeAll. With every file
    // starting at once that can pass the 10 second default, and a suite that
    // times out never cleans up, leaving zz- records that fail the next run.
    hookTimeout: 30000,
  },
})

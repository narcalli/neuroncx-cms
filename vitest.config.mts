import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

import { TEST_DB_URL } from './scripts/test-db.mjs'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    // A one-node replica set on this machine (scripts/test-db.mjs), started
    // once before the run, so saves run in transactions as on Atlas. The dev
    // database has none, and Payload switches transactions off there.
    globalSetup: ['./tests/globalSetup.ts'],
    env: { DATABASE_URL: TEST_DB_URL },
    include: ['tests/int/**/*.int.spec.ts'],
    // Each database suite starts Payload in its beforeAll. With every file
    // starting at once that can pass the 10 second default, and a suite that
    // times out never cleans up, leaving zz- records that fail the next run.
    hookTimeout: 30000,
    // The same for a file's first test that saves: Payload starting up and the
    // first imports take a few seconds once every file runs at once.
    testTimeout: 20000,
  },
})

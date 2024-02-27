import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    logHeapUsage: true,
    // So that `process.chdir` works. See https://vitest.dev/config/#forks
    pool: 'forks'
  },
})

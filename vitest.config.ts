import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    logHeapUsage: true,
    // So that `process.chdir` works. See https://vitest.dev/config/#forks
    pool: "forks",
  },
});

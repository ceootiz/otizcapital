import { defineConfig } from "vitest/config";

// Several database tests run real queries against the remote Neon instance;
// the default 5s timeout clips them under normal network latency. Raise the
// per-test and hook budgets so latency alone can't fail the suite.
export default defineConfig({
  test: {
    testTimeout: 30000,
    hookTimeout: 30000
  }
});

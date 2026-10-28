import path from "node:path";
import { defineConfig } from "vitest/config";

// Unit tests cover the pure v2 logic in lib/; rendering is checked by the
// Playwright suites in e2e/ against the dev server.
export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname) } },
  test: {
    include: ["lib/**/*.test.ts"],
    environment: "node",
  },
});

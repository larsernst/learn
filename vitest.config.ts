import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["tests/unit/**/*.test.ts"],
    coverage: {
      reporter: ["text", "html"],
      include: ["src/lib/**/*.ts"],
      // Schwellen knapp unter dem Ist-Stand (~79/91/73/79), damit die
      // Abdeckung nicht unbemerkt absinkt. DB-gekoppelte Dateien
      // (auth.ts, settings.ts, …) werden ueber tests/integration und
      // die E2E-Suite abgedeckt.
      thresholds: { lines: 75, branches: 88, functions: 70, statements: 75 },
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Integrations-Tests laufen gegen eine echte PostgreSQL-Datenbank
// (DATABASE_URL). Sie sind kein Ersatz für die reinen Unit-Tests, sondern
// decken Seed/Migrations-Verhalten und Prisma-Zugriffe ab. Lokal: Docker-DB
// starten (`docker compose up -d db`), dann `npm run test:integration`.
// Ohne erreichbare Datenbank überspringen sich die Tests selbst.
export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["tests/integration/**/*.test.ts"],
    testTimeout: 120_000,
    hookTimeout: 120_000,
    // Seed/Migrate laufen über Kindprozesse und mehrere Tests schreiben in
    // dieselbe Datenbank – strikt sequenziell ausführen.
    pool: "forks",
    poolOptions: { forks: { singleFork: true } },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});

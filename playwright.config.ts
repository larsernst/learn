import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    actionTimeout: 10_000,
  },
  projects: [
    {
      name: "chromium",
      testMatch: /.*\.spec\.ts/,
      testIgnore: [/admin\.spec\.ts/, /editor\.spec\.ts/],
      use: { browserName: "chromium" },
    },
    // Admin-E2E: zuerst Setup (Admin anlegen + Storage-State), dann die
    // Admin-Tests mit diesem Storage-State.
    {
      name: "admin-setup",
      testMatch: /admin\.setup\.ts/,
      use: { browserName: "chromium" },
    },
    {
      name: "admin-chromium",
      testMatch: /admin\.spec\.ts/,
      dependencies: ["admin-setup"],
      use: {
        browserName: "chromium",
        storageState: "tests/e2e/.auth/admin.json",
      },
    },
    // Editor-E2E: Setup legt einen Nutzer mit Rolle "editor" an
    // (Storage-State), die Editor-Tests laufen damit.
    {
      name: "editor-setup",
      testMatch: /editor\.setup\.ts/,
      use: { browserName: "chromium" },
    },
    {
      name: "editor-chromium",
      testMatch: /editor\.spec\.ts/,
      dependencies: ["editor-setup"],
      use: {
        browserName: "chromium",
        storageState: "tests/e2e/.auth/editor.json",
      },
    },
  ],
});
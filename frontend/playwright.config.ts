import { defineConfig } from "@playwright/test";

/**
 * End-to-end tests against a local Anvil chain with the deployed protocol.
 * Prereqs (from the repo root): `anvil` running and `npm run deploy:local && npm run export-abis`.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  use: { baseURL: "http://127.0.0.1:5173", viewport: { width: 1360, height: 900 } },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 5173 --strictPort",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: true,
    env: { VITE_CHAINS: "local", VITE_DEV_WALLET: "true" },
  },
});

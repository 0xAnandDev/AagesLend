/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Keep the wallet stack out of the main chunk so the landing page loads fast.
        manualChunks: {
          web3: ["wagmi", "viem", "@rainbow-me/rainbowkit", "@tanstack/react-query"],
        },
      },
    },
    chunkSizeWarningLimit: 1500,
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});

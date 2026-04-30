import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  server: {
    allowedHosts: [
      "localhost",
      "127.0.0.1",
      "favored-scalded-tusk.ngrok-free.dev",
    ],
  },

  test: {
    exclude: ["**/e2e/**", "**/node_modules/**", "**/dist/**"],
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
  },
});

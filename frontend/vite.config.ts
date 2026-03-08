import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "node:fs";
import { parse as parseEnv } from "dotenv";

function loadSecretEnv(): Record<string, string> {
  try {
    return parseEnv(readFileSync(".env.secret"));
  } catch {
    return {};
  }
}

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ""), ...loadSecretEnv() };
  const target = "http://10.93.25.188:42002";

  return {
    plugins: [react()],
    server: {
      proxy: {
        "/items": { target, changeOrigin: true },
        "/learners": { target, changeOrigin: true },
        "/interactions": { target, changeOrigin: true },
        "/docs": { target, changeOrigin: true },
        "/openapi.json": { target, changeOrigin: true },
        "/analytics": { target, changeOrigin: true },
      },
    },
  };
});
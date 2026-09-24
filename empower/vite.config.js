import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

// The Empower site is its own website. BASE is where it's served:
//   /Website/empower/  on GitHub Pages today (default)
//   /                  on its own domain (e.g. empower.solix.com)
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const base = env.VITE_BASE || "/Website/empower/";
  process.env.VITE_BASE = base;
  return {
    base,
    plugins: [react()],
    resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
    build: { outDir: "dist", sourcemap: false, chunkSizeWarningLimit: 600 },
  };
});

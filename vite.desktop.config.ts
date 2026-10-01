import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { resolve } from "node:path";

export default defineConfig({
  root: "desktop",
  base: "./",
  plugins: [react(), tsconfigPaths()],
  build: {
    outDir: "../dist-desktop",
    emptyOutDir: true,
    rollupOptions: { input: resolve(__dirname, "desktop/index.html") },
  },
});

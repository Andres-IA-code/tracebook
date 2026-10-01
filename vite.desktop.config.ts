import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  root: "desktop",
  base: "./",
  plugins: [react(), tailwindcss(), tsconfigPaths()],
  build: {
    outDir: "../dist-desktop",
    emptyOutDir: true,
  },
});

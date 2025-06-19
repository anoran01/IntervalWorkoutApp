import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['jeep-sqlite', 'sql.js']
  },
  build: {
    rollupOptions: {
      external: ['jeep-sqlite/loader'],
    },
    outDir: "../dist/client",
    emptyOutDir: true,
    assetsInlineLimit: 0, // Prevent inlining of WASM files
    sourcemap: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: "client",
});

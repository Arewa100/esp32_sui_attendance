import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      open: false,
      filename: "dist/stats.html",
      gzipSize: true,
      brotliSize: true,
      template: "treemap", // or "sunburst" or "network"
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    // Optimize dev server performance
    hmr: {
      overlay: true,
    },
  },
  // Optimize build performance
  build: {
    target: "esnext",
    minify: "esbuild",
    sourcemap: false,
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
    // Remove manual chunking to let Vite handle it automatically
    // This avoids module resolution and initialization order issues
  },
  // Optimize dependency pre-bundling
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@mysten/dapp-kit",
      "@tanstack/react-query",
    ],
    exclude: [],
  },
});




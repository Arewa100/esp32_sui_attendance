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
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Split large vendor chunks
          if (id.includes("node_modules")) {
            if (id.includes("@mysten/sui") || id.includes("@mysten/dapp-kit")) {
              return "sui-vendor";
            }
            if (id.includes("react") || id.includes("react-dom") || id.includes("react-router")) {
              return "react-vendor";
            }
            if (id.includes("@tanstack/react-query")) {
              return "query-vendor";
            }
            if (id.includes("chart.js") || id.includes("react-chartjs-2")) {
              return "chart-vendor";
            }
            if (id.includes("recharts")) {
              return "recharts-vendor";
            }
            if (id.includes("@radix-ui")) {
              return "radix-vendor";
            }
            // Other vendor code
            return "vendor";
          }
        },
      },
    },
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




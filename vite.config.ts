import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
    // Performance optimizations
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        // Code splitting for better caching
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react/jsx-runtime'],
          'router': ['wouter'],
          'ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
          'query': ['@tanstack/react-query'],
        },
      },
    },
    // Chunk size warnings
    chunkSizeWarningLimit: 1000,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    host: "0.0.0.0",
  },
});

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5177,
    strictPort: true,
    host: true,
    hmr: {
      host: "localhost",
      port: 5177,
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          mui: ["@mui/material", "@mui/icons-material"],
          leaflet: ["leaflet"],
          router: ["react-router-dom"],
        },
      },
    },
    chunkSizeWarningLimit: 750,
  },
});

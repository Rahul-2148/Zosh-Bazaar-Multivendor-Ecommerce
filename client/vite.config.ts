import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    warmup: {
      clientFiles: [
        "./src/main.tsx",
        "./src/App.tsx",
        "./src/customer/Navbar/Navbar.tsx",
        "./src/customer/pages/Home/Home.tsx",
      ],
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          mui: ["@mui/material", "@mui/icons-material"],
          redux: ["@reduxjs/toolkit", "react-redux"],
          router: ["react-router-dom"],
          forms: ["formik", "yup"],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

function muiIconsOptimizer() {
  return {
    name: "mui-icons-optimizer",
    enforce: "pre" as const,
    transform(code: string, id: string) {
      if (!id.endsWith(".tsx") && !id.endsWith(".ts")) return null;
      if (!code.includes("@mui/icons-material")) return null;
      const replaced = code.replace(
        /import\s*\{([^}]+)\}\s*from\s*["']@mui\/icons-material["'];?/g,
        (_, imports) => {
          return imports
            .split(",")
            .map((i: string) => i.trim())
            .filter(Boolean)
            .map((i: string) => {
              if (i.includes(" as ")) {
                const [orig, alias] = i.split(" as ").map((s: string) => s.trim());
                return `import ${alias} from "@mui/icons-material/${orig}";`;
              }
              return `import ${i} from "@mui/icons-material/${i}";`;
            })
            .join("\n");
        }
      );
      return { code: replaced, map: null };
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [muiIconsOptimizer(), tailwindcss(), react()],
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
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        manualChunks: {
          mui: ["@mui/material"],
          redux: ["@reduxjs/toolkit", "react-redux"],
          router: ["react-router-dom"],
          forms: ["formik", "yup"],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});

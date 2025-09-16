import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
   base: mode === "production" ? "/PetConnect-Frontend/" : "/"
,
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api": {
        target: "https://localhost:7213",
        changeOrigin: true,
        secure: false, 
      },
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));

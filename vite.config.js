import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  // Load variables from .env based on the current mode
  const env = loadEnv(mode, process.cwd());

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      proxy: {
        "/api/v1": {
          // Point this to your Render URL in your .env file
          target: env.VITE_SERVER,
          changeOrigin: true,
          secure: false, // Render uses HTTPS, but local might not
          // rewrite: (path) => path.replace(/^\/api\/v1/, '/api/v1'), // Optional: adjust if Render base path differs
        },
      },
    },
  };
});
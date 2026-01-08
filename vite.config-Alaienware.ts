import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const pagesBase = env.PAGES_BASE || "/";
  const pagesDeploy = env.PAGES_DEPLOY || "";
  return {
    base: pagesBase,
    define: {
      "import.meta.env.PAGES_DEPLOY": JSON.stringify(pagesDeploy),
    },
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: "http://127.0.0.1:8000",
          changeOrigin: true,
        },
      },
    },
  };
});

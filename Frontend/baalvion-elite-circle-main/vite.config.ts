import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // Base URL of the self-hosted Baalvion Elite Circle backend (Node.js + PostgreSQL,
  // see Backend/services/ecosystem/elite-circle-service, default port 3051).
  const apiUrl =
    env.VITE_API_URL ?? "https://api.baalvion.com/api/v1/ecosystem/elite-circle/v1";

  return {
    server: {
      host: "::",
      port: 8081,
    },
    define: {
      "import.meta.env.VITE_API_URL": JSON.stringify(apiUrl),
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});

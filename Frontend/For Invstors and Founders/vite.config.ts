import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Dev proxy targets — kept server-side so the browser stays SAME-ORIGIN with the gateway.
// That makes the gateway's HttpOnly session cookies + JS-readable csrf_token work without CORS.
const GATEWAY_TARGET = process.env.VITE_GATEWAY_TARGET ?? "http://localhost:3099"; // auth-gateway (BFF)
const INSIDERS_TARGET = process.env.VITE_INSIDERS_TARGET ?? "http://localhost:3050"; // insiders-service (public/direct)

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      // Authenticated path: browser → /auth-bff → auth-gateway (login/refresh/me/logout + /api/* proxy
      // which injects signed identity and enforces the session/CSRF trust boundary).
      "/auth-bff": { target: GATEWAY_TARGET, changeOrigin: true, rewrite: (p) => p.replace(/^\/auth-bff/, "") },
      // Anonymous/public path: browser → /insiders-api → insiders-service directly. Only public table
      // policies succeed here; anything auth-gated 401s (the backend trusts ONLY signed gateway identity).
      "/insiders-api": { target: INSIDERS_TARGET, changeOrigin: true, rewrite: (p) => p.replace(/^\/insiders-api/, "") },
    },
  },
  define: {
    // Gateway base the adapter uses for auth + authenticated data (same-origin proxy in dev).
    "import.meta.env.VITE_GATEWAY_URL": JSON.stringify(process.env.VITE_GATEWAY_URL ?? "/auth-bff"),
    // Insiders backend base for anonymous/public reads + storage URLs (same-origin proxy in dev).
    "import.meta.env.VITE_INSIDERS_URL": JSON.stringify(process.env.VITE_INSIDERS_URL ?? "/insiders-api"),
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));

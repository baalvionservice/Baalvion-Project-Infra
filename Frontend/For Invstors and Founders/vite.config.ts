import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Dev proxy targets — kept server-side so the browser stays SAME-ORIGIN with the gateway.
// That makes the gateway's HttpOnly session cookies + JS-readable csrf_token work without CORS.
const GATEWAY_TARGET = process.env.VITE_GATEWAY_TARGET ?? "http://localhost:3099"; // auth-gateway (BFF)
const INSIDERS_TARGET = process.env.VITE_INSIDERS_TARGET ?? "http://localhost:3050"; // insiders-service (public/direct)

// Same-origin BFF proxy table — shared by the dev server and the production `vite preview`
// server so authenticated (/auth-bff) and anonymous (/insiders-api) calls work identically
// whether running `vite` (dev) or serving the built dist via `vite preview` (production).
const bffProxy = {
  // Authenticated path: browser → /auth-bff → auth-gateway (login/refresh/me/logout + /api/* proxy
  // which injects signed identity and enforces the session/CSRF trust boundary).
  "/auth-bff": { target: GATEWAY_TARGET, changeOrigin: true, rewrite: (p: string) => p.replace(/^\/auth-bff/, "") },
  // Anonymous/public path: browser → /insiders-api → insiders-service directly. Only public table
  // policies succeed here; anything auth-gated 401s (the backend trusts ONLY signed gateway identity).
  "/insiders-api": { target: INSIDERS_TARGET, changeOrigin: true, rewrite: (p: string) => p.replace(/^\/insiders-api/, "") },
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    // 8082 to avoid colliding with Proxy-BaalvionStack (8080); strictPort makes the
    // conflict fail loudly instead of silently grabbing a random next port.
    port: 8082,
    strictPort: true,
    proxy: bffProxy,
  },
  // Production: `vite preview` serves the optimized dist/ build. server.* only applies to the
  // dev server, so preview needs its own port + proxy to keep founders.baalvion.com working
  // the same in production as in dev.
  preview: {
    host: "::",
    port: 8082,
    strictPort: true,
    proxy: bffProxy,
    // Vite blocks Host headers it doesn't recognise. When served behind the local reverse
    // proxy / Caddy at founders.baalvion.com (or .local), the upstream Host is the domain,
    // so it must be allow-listed or preview returns "Blocked request. This host is not allowed."
    allowedHosts: [".baalvion.com", ".baalvion.local", "localhost"],
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

import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load .env / .env.local / .env.[mode] so the auth-proxy target AND the CSP origins derive from the
  // SAME values the client build inlines (import.meta.env.*). Previously these read process.env
  // directly — which is empty when `vite preview` starts — so the CSP fell back to the prod origin
  // (api.baalvion.com) while the client bundle called http://localhost:4000. That divergence is the
  // local "env mismatch": the browser blocked the checkout fetch by CSP. loadEnv keeps them aligned.
  const env = loadEnv(mode, process.cwd(), "");

  // Same-origin auth proxy target. In production the SPA's static host (e.g. nginx) MUST reverse-proxy
  // /auth-bff → this gateway path so the httpOnly refresh cookie flows same-origin. Locally it points
  // at proxy-service's customer auth (POST /v1/auth/register|login|refresh — provisions the tenant).
  const AUTH_PROXY =
    env.VITE_AUTH_PROXY_TARGET ||
    env.VITE_API_AUTH_BASE_URL ||
    "https://api.baalvion.com/api/v1/identity/auth/v1/auth";
  const authUrl = new URL(AUTH_PROXY);

  // CSP connect-src must list the API ORIGIN (not a path-scoped URL, which browsers match by exact
  // path). Derive the origin from the configured base URLs so local dev (http://localhost:4000) and
  // prod both work without hand-editing the policy.
  const toOrigin = (value: string | undefined, fallback: string) => {
    try {
      return new URL(value || fallback).origin;
    } catch {
      return fallback;
    }
  };
  const PLATFORM_ORIGIN = toOrigin(env.VITE_API_PLATFORM_BASE_URL, "https://api.baalvion.com");
  const AUTH_ORIGIN = toOrigin(env.VITE_API_AUTH_BASE_URL, "https://api.baalvion.com");

  // Razorpay hosted Checkout (the in-SPA modal): the page loads checkout.js, opens an iframe, and the
  // script calls Razorpay's API. The CSP must allow these origins in script/frame/connect/img or the
  // modal is blocked. (Resources INSIDE the iframe are governed by Razorpay's own CSP, not ours.)
  // Razorpay loads from several subdomains (checkout.* for the script, cdn.* for its risk-detection
  // bundle, api.* for the modal iframe, lumberjack.* for telemetry), so allow the whole *.razorpay.com.
  const RAZORPAY_SCRIPT = "https://*.razorpay.com";
  const RAZORPAY_FRAME = "https://*.razorpay.com";
  const RAZORPAY_CONNECT = "https://*.razorpay.com";
  const RAZORPAY_IMG = "https://*.razorpay.com";
  // PayU is a form-POST redirect to its hosted page → allow it as a form-action target.
  const PAYU_FORM = "https://*.payu.in";
  // Cashfree loads its v3 SDK + redirects/iframes to its hosted checkout.
  const CASHFREE = "https://*.cashfree.com";
  // Stripe: hosted Checkout redirect + Stripe.js / API.
  const STRIPE = "https://*.stripe.com";

  // Same-origin auth proxy — forward /auth-bff/* to the auth gateway so the httpOnly cookie is set
  // against localhost:8080 and flows on every request. No CORS, no cross-site cookies. Shared by the
  // dev server and the production `vite preview` server.
  const authBffProxy = {
    "/auth-bff": {
      target: authUrl.origin,
      changeOrigin: true,
      secure: true,
      rewrite: (p: string) => p.replace(/^\/auth-bff/, authUrl.pathname),
    },
  };

  // Hardened response headers (CSP, framing, sniffing) applied in both dev and production preview.
  const securityHeaders = {
    "X-Frame-Options": "SAMEORIGIN",
    "X-Content-Type-Options": "nosniff",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Content-Security-Policy": [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline' ${RAZORPAY_SCRIPT} ${CASHFREE} ${STRIPE}`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      `img-src 'self' data: blob: https://placehold.co https://images.unsplash.com ${RAZORPAY_IMG} ${CASHFREE} ${STRIPE}`,
      "font-src 'self' data: https://fonts.gstatic.com",
      `connect-src 'self' ${AUTH_ORIGIN} ${PLATFORM_ORIGIN} ${RAZORPAY_CONNECT} ${CASHFREE} ${STRIPE}`,
      `frame-src ${RAZORPAY_FRAME} ${CASHFREE} ${STRIPE}`,
      "frame-ancestors 'none'",
      `form-action 'self' ${PAYU_FORM} ${CASHFREE} ${STRIPE}`,
      "base-uri 'self'",
      "object-src 'none'",
    ].join("; "),
  };

  return {
    server: {
      host: "::",
      port: 8080,
      strictPort: true,
      proxy: authBffProxy,
      headers: securityHeaders,
    },
    // Production: `vite preview` serves the optimized dist/ build with the same port, proxy, and
    // hardened headers as dev so proxy.baalvionstack.com behaves identically in production.
    preview: {
      host: "::",
      port: 8080,
      strictPort: true,
      proxy: authBffProxy,
      headers: securityHeaders,
      // Vite blocks unrecognised Host headers. Behind the local reverse proxy / Caddy the
      // upstream Host is proxy.baalvionstack.com (or .local), so it must be allow-listed or
      // preview returns "Blocked request. This host is not allowed."
      allowedHosts: [".baalvionstack.com", ".baalvionstack.local", "localhost"],
    },
    build: {
      // Vite's default build target ('modules' = es2020 + browser mins) trips an
      // esbuild transpile bug in CI ("Transforming destructuring to the configured
      // target environment is not supported yet") on async/await + destructuring.
      // esnext disables syntax downleveling, which both fixes it and fits a modern SPA.
      target: "esnext",
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});

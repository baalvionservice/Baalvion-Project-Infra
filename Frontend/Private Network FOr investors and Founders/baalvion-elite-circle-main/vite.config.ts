import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  // Fallbacks to prevent blank screen if env injection fails in preview.
  // Values are public client settings (URL + publishable key).
  define: {
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
      process.env.VITE_SUPABASE_URL ?? "https://btibizacbhyxvvbwdafb.supabase.co",
    ),
    "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0aWJpemFjYmh5eHZ2YndkYWZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3MTE3MTMsImV4cCI6MjA3NTI4NzcxM30.9Odccr8G_KZlzBRay9DFXujfs9k7Ewe0LW054AsZY_Q",
    ),
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));

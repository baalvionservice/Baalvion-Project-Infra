"use client";

import { useEffect } from "react";

// Replaces the whole document when the root layout throws, so it owns <html>/<body>
// and cannot assume globals.css loaded — the palette is restated inline.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[company-unified-Dashboard-main] Root layout error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem 1rem",
          background: "#F7FAFE",
          color: "#030712",
          fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <main style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
          <p
            style={{
              margin: 0,
              fontSize: 60,
              fontWeight: 700,
              lineHeight: 1,
              color: "#143FCC",
            }}
          >
            500
          </p>
          <h1
            style={{
              margin: "0.5rem 0 0",
              fontSize: 28,
              fontWeight: 600,
              letterSpacing: "-0.025em",
            }}
          >
            Something Went Wrong
          </h1>
          <p style={{ margin: "1rem 0 2rem", color: "#5B6472", lineHeight: 1.6 }}>
            The application could not be loaded. Retry, or head back to your dashboard.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                background: "#143FCC",
                color: "#FAFBFC",
                border: 0,
                borderRadius: 8,
                padding: "0.75rem 2rem",
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Try Again
            </button>
            <a
              href="/dashboard"
              style={{
                background: "transparent",
                color: "#030712",
                border: "1px solid #E3E7EC",
                borderRadius: 8,
                padding: "0.75rem 2rem",
                fontSize: 15,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Go to Dashboard
            </a>
          </div>
          {error?.digest ? (
            <p style={{ marginTop: 24, fontSize: 11, color: "#9AA3B0", letterSpacing: "0.1em" }}>
              REF: {error.digest}
            </p>
          ) : null}
        </main>
      </body>
    </html>
  );
}

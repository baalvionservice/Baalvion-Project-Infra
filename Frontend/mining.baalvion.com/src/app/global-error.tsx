"use client";

import { useEffect } from "react";

// Replaces the whole document when the root layout throws, so it owns <html>/<body>
// and cannot assume globals.css loaded — the deep-blue/aqua palette is restated inline.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Mining.Baalvion-main] Root layout error:", error);
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
          background: "#ECF0F5",
          color: "#111827",
          fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <main style={{ maxWidth: 448, width: "100%", textAlign: "center" }}>
          <div
            style={{
              width: 56,
              height: 6,
              margin: "0 auto 28px",
              borderRadius: 999,
              background: "#21CEDD",
            }}
          />
          <h1
            style={{
              margin: "0 0 0.75rem",
              fontSize: "clamp(1.75rem, 1rem + 3vw, 2.25rem)",
              fontWeight: 900,
              fontStyle: "italic",
              textTransform: "uppercase",
              letterSpacing: "-0.045em",
              lineHeight: 1.1,
            }}
          >
            System Fault
          </h1>
          <p style={{ margin: "0 0 2rem", color: "#65758B", fontWeight: 500, lineHeight: 1.6 }}>
            The application failed to start. No trade records were affected — retry, or return to
            the homepage.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                width: "100%",
                minHeight: 48,
                background: "#1B4498",
                color: "#F8FAFC",
                border: 0,
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Try Again
            </button>
            <a
              href="/"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 48,
                color: "#65758B",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Back to Homepage
            </a>
          </div>
          {error?.digest ? (
            <p style={{ marginTop: 24, fontSize: 11, color: "#94A3B8", letterSpacing: "0.1em" }}>
              REF: {error.digest}
            </p>
          ) : null}
        </main>
      </body>
    </html>
  );
}

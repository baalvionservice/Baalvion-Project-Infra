"use client";

import { useEffect } from "react";

// Replaces the whole document when the root layout throws, so it owns <html>/<body>
// and cannot assume globals.css or the Google fonts loaded — the dark palette is
// restated inline.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[baalvion-intelligence] Root layout error:", error);
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
          padding: "2rem 1.5rem",
          background: "#05080F",
          color: "#F1F5F9",
          fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <main style={{ maxWidth: 520, width: "100%", textAlign: "center" }}>
          <p
            style={{
              margin: 0,
              fontSize: 11,
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.28em",
              color: "#22D3EE",
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, "JetBrains Mono", monospace',
            }}
          >
            Signal lost
          </p>
          <h1
            style={{
              margin: "1rem 0 0.75rem",
              fontSize: "clamp(1.9rem, 1rem + 3vw, 2.75rem)",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
            }}
          >
            Something went wrong
          </h1>
          <p style={{ margin: "0 0 2rem", color: "#8F9CAE", lineHeight: 1.6 }}>
            The application failed to start. Nothing was lost — retry, or head back to the
            homepage.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                background: "#22D3EE",
                color: "#050B14",
                border: 0,
                borderRadius: 10,
                padding: "0.7rem 1.5rem",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            <a
              href="/"
              style={{
                background: "transparent",
                color: "#F1F5F9",
                border: "1px solid #242A38",
                borderRadius: 10,
                padding: "0.7rem 1.5rem",
                fontSize: 14,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Back to home
            </a>
          </div>
          {error?.digest ? (
            <p
              style={{
                marginTop: 28,
                fontSize: 11,
                color: "#5A6678",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, "JetBrains Mono", monospace',
              }}
            >
              REF: {error.digest}
            </p>
          ) : null}
        </main>
      </body>
    </html>
  );
}

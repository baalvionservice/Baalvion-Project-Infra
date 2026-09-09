"use client";

import { useEffect } from "react";

/**
 * Replaces the document when the root layout itself fails, so globals.css never
 * loads — every value here is the literal token error.tsx resolves to.
 *
 * No auto-retry, unlike error.tsx: that one recovers from a flaky CMS read, while
 * a root-layout failure repeats on every attempt and a timer would only thrash.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Root layout render failed:", error);
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
          padding: "1.5rem",
          background: "#ffffff",
          color: "#111827",
          fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        }}
      >
        <div style={{ maxWidth: "28rem", textAlign: "center" }}>
          <span
            style={{
              display: "block",
              marginBottom: "1rem",
              fontSize: "12px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              color: "#ff9900",
            }}
          >
            Baalvion
          </span>
          <h1 style={{ margin: "0 0 0.75rem", fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
            Service Temporarily Unavailable
          </h1>
          <p style={{ margin: "0 0 1.5rem", lineHeight: 1.625, color: "#4b5563" }}>
            The site could not be loaded. Please try again in a moment.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              border: 0,
              borderRadius: "0.375rem",
              padding: "0.625rem 1.25rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: "pointer",
              background: "#111827",
              color: "#ffffff",
            }}
          >
            Retry now
          </button>
          {error.digest ? (
            <p style={{ margin: "2rem 0 0", fontSize: "0.75rem", letterSpacing: "0.15em", color: "#9ca3af" }}>
              REF {error.digest}
            </p>
          ) : null}
        </div>
      </body>
    </html>
  );
}

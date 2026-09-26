import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #0A0E1A 0%, #0C1228 55%, #0A1530 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
            <div style={{ width: 16, height: 26, borderRadius: 4, background: "#4F46E5" }} />
            <div style={{ width: 16, height: 42, borderRadius: 4, background: "#6366F1" }} />
            <div style={{ width: 16, height: 60, borderRadius: 4, background: "#22D3EE" }} />
          </div>
          <div style={{ fontSize: 34, fontWeight: 700, color: "#F8FAFC", letterSpacing: -0.5 }}>
            Baalvion Intelligence
          </div>
        </div>
        <div
          style={{
            fontSize: 56,
            fontWeight: 700,
            color: "#F8FAFC",
            lineHeight: 1.15,
            letterSpacing: -1,
            maxWidth: 980,
          }}
        >
          Turn every headline on Earth into an API call
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 28,
            color: "#94A3B8",
            maxWidth: 900,
          }}
        >
          AI summaries, sentiment, and alerts — built for AI agents and businesses.
        </div>
      </div>
    ),
    { ...size }
  );
}

import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0A0E1A 0%, #0A1530 100%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-end", gap: 14 }}>
          <div
            style={{
              width: 26,
              height: 44,
              borderRadius: 6,
              background: "linear-gradient(180deg, #4F46E5 0%, #6366F1 100%)",
            }}
          />
          <div
            style={{
              width: 26,
              height: 74,
              borderRadius: 6,
              background: "linear-gradient(180deg, #4F46E5 0%, #22D3EE 100%)",
            }}
          />
          <div
            style={{
              width: 26,
              height: 108,
              borderRadius: 6,
              background: "linear-gradient(180deg, #22D3EE 0%, #67E8F9 100%)",
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}

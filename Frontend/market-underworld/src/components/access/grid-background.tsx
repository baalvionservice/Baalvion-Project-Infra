"use client"

/**
 * Ambient background only — ammonia-green grid + a scanning sweep line, pure CSS. No claims of
 * live data anywhere in here (unlike the "world map with live node connections"/"AI voice
 * assistant"/"transaction radar" asks in the brief, which would need real backend systems this
 * pass doesn't build — see the summary for why those were left out rather than faked).
 */
export function GridBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-black">
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #00ff9d22 1px, transparent 1px), linear-gradient(to bottom, #00ff9d22 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
      <div className="scan-sweep absolute inset-x-0 h-40 bg-gradient-to-b from-emerald-500/10 via-emerald-500/5 to-transparent" />
      <style>{`
        @keyframes scanSweep {
          0% { transform: translateY(-10%); }
          100% { transform: translateY(110vh); }
        }
        .scan-sweep {
          animation: scanSweep 8s linear infinite;
        }
      `}</style>
    </div>
  );
}

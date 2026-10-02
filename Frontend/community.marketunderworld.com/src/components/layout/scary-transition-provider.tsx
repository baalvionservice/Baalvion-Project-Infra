"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";

interface TransitionContextType {
  navigateWithScare: (url: string) => void;
}

const TransitionContext = createContext<TransitionContextType>({
  navigateWithScare: () => {},
});

export const useScaryTransition = () => useContext(TransitionContext);

// Inline CSS injected via <style> tag — zero Tailwind dependency
const SCARY_CSS = `
  @keyframes hellGate {
    0%   { transform: scaleX(1); }
    100% { transform: scaleX(0); }
  }
  @keyframes demonRise {
    0%   { transform: translateY(80px) scale(0.5); opacity: 0; filter: brightness(3) drop-shadow(0 0 30px #ff0000); }
    40%  { transform: translateY(0) scale(1.1); opacity: 1; filter: brightness(2) drop-shadow(0 0 60px #ff0000); }
    70%  { transform: scale(1.0); filter: brightness(1.2) drop-shadow(0 0 40px #cc0000); }
    85%  { transform: scale(1.06); filter: brightness(1.8) drop-shadow(0 0 80px #ff3300); }
    100% { transform: scale(1.03); filter: brightness(1) drop-shadow(0 0 30px #aa0000); }
  }
  @keyframes hellFlicker {
    0%, 100% { opacity: 1; }
    10%  { opacity: 0.7; }
    20%  { opacity: 1; }
    30%  { opacity: 0.4; }
    40%  { opacity: 1; }
    50%  { opacity: 0.8; }
    60%  { opacity: 0.3; }
    70%  { opacity: 1; }
    80%  { opacity: 0.6; }
    90%  { opacity: 0.9; }
  }
  @keyframes bloodDrip {
    0%   { transform: translateY(-100%); opacity: 0; }
    20%  { opacity: 1; }
    100% { transform: translateY(100vh); opacity: 0.6; }
  }
  @keyframes pentagramSpin {
    0%   { transform: rotate(0deg) scale(0.8); opacity: 0; }
    20%  { opacity: 0.15; }
    100% { transform: rotate(360deg) scale(1); opacity: 0.12; }
  }
  @keyframes redPulse {
    0%, 100% { box-shadow: inset 0 0 80px rgba(255,0,0,0.27), inset 0 0 200px rgba(136,0,0,0.13); }
    50%       { box-shadow: inset 0 0 150px rgba(255,0,0,0.6), inset 0 0 300px rgba(204,0,0,0.33); }
  }
  @keyframes shakeScreen {
    0%, 100% { transform: translate(0, 0); }
    10% { transform: translate(-4px, -2px); }
    20% { transform: translate(4px, 2px); }
    30% { transform: translate(-3px, 3px); }
    40% { transform: translate(3px, -3px); }
    50% { transform: translate(-2px, 2px); }
    60% { transform: translate(2px, -2px); }
    70% { transform: translate(-4px, 4px); }
    80% { transform: translate(4px, -4px); }
    90% { transform: translate(-2px, -2px); }
  }
  @keyframes glitchText {
    0%, 90%, 100% { transform: translateX(-50%); }
    92% { transform: translateX(calc(-50% - 4px)); }
    94% { transform: translateX(calc(-50% + 4px)); }
    96% { transform: translateX(calc(-50% - 2px)); }
    98% { transform: translateX(-50%); }
  }
`;

const BLOOD_DRIPS = [0, 1, 2, 3, 4, 5, 6, 7, 8];

export function ScaryTransitionProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<"idle" | "darken" | "gate" | "logo" | "exit">("idle");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navigateWithScare = useCallback((url: string) => {
    if (phase !== "idle") return;

    setPhase("darken");
    setTimeout(() => setPhase("gate"), 600);
    setTimeout(() => setPhase("logo"), 1600);
    setTimeout(() => {
      // Use window.location for navigation — avoids useRouter SSR issues entirely
      window.location.href = url;
    }, 4200);
    setTimeout(() => setPhase("exit"), 4400);
    setTimeout(() => setPhase("idle"), 5200);
  }, [phase]);

  const isVisible = phase !== "idle";
  const gateActive = phase === "gate" || phase === "logo" || phase === "exit";
  const logoActive = phase === "logo";

  if (!mounted) {
    return (
      <TransitionContext.Provider value={{ navigateWithScare }}>
        {children}
      </TransitionContext.Provider>
    );
  }

  const overlay = createPortal(
    <>
      <style dangerouslySetInnerHTML={{ __html: SCARY_CSS }} />
      <div
        style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 2147483647,
          pointerEvents: isVisible ? "all" : "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          backgroundColor: "#000000",
          opacity: phase === "idle" ? 0 : phase === "exit" ? 0 : 1,
          transition: phase === "exit" ? "opacity 0.9s ease" : "opacity 0.2s ease",
          animation: logoActive ? "redPulse 0.8s ease-in-out infinite, shakeScreen 0.12s linear infinite" : "none",
        }}
      >
        {isVisible && (
          <>
            {/* Blood red radial glow */}
            <div style={{
              position: "absolute",
              top: 0, left: 0, right: 0, bottom: 0,
              background: "radial-gradient(ellipse at center, rgba(180,0,0,0.65) 0%, rgba(60,0,0,0.45) 40%, rgba(0,0,0,0.97) 100%)",
              opacity: logoActive ? 1 : 0,
              transition: "opacity 1s ease",
            }} />

            {/* Left gate panel */}
            <div style={{
              position: "absolute",
              left: 0, top: 0, bottom: 0, width: "50%",
              background: "linear-gradient(to right, #000000, #080000)",
              transformOrigin: "left center",
              animation: gateActive ? "hellGate 1.3s cubic-bezier(0.87, 0, 0.13, 1) forwards" : "none",
              borderRight: "3px solid #770000",
              boxShadow: "6px 0 40px rgba(255,0,0,0.5)",
            }} />

            {/* Right gate panel */}
            <div style={{
              position: "absolute",
              right: 0, top: 0, bottom: 0, width: "50%",
              background: "linear-gradient(to left, #000000, #080000)",
              transformOrigin: "right center",
              animation: gateActive ? "hellGate 1.3s cubic-bezier(0.87, 0, 0.13, 1) forwards" : "none",
              borderLeft: "3px solid #770000",
              boxShadow: "-6px 0 40px rgba(255,0,0,0.5)",
            }} />

            {/* Pentagram */}
            <div style={{
              position: "absolute",
              width: "min(80vw, 800px)", height: "min(80vw, 800px)",
              opacity: logoActive ? 0.13 : 0,
              transition: "opacity 0.8s ease",
              fontSize: "min(80vw, 800px)",
              lineHeight: 1,
              color: "#ff0000",
              userSelect: "none",
              animation: logoActive ? "pentagramSpin 10s linear infinite" : "none",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>✡</div>

            {/* Blood drips */}
            {logoActive && BLOOD_DRIPS.map(i => (
              <div key={i} style={{
                position: "absolute", top: 0,
                left: `${8 + i * 10}%`,
                width: `${4 + (i % 3) * 3}px`,
                background: "linear-gradient(to bottom, #cc0000, #550000)",
                borderRadius: "0 0 50% 50%",
                animation: `bloodDrip ${1.2 + i * 0.25}s ease-in ${i * 0.15}s infinite`,
                height: `${70 + (i % 5) * 50}px`,
              }} />
            ))}

            {/* Demon logo */}
            <div style={{
              position: "relative", zIndex: 10,
              width: "min(70vw, 500px)", height: "min(70vw, 500px)",
              animation: logoActive ? "demonRise 1.1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards" : "none",
              opacity: logoActive ? undefined : 0,
            }}>
              <Image src="/logo.jpg" alt="Baal" fill style={{ objectFit: "contain" }} priority />
            </div>

            {/* Brand text */}
            {logoActive && (
              <div style={{
                position: "absolute", bottom: "12%", left: "50%",
                fontFamily: "Georgia, serif",
                fontSize: "clamp(20px, 3.5vw, 44px)",
                fontWeight: "900", letterSpacing: "0.45em",
                color: "#cc0000",
                textShadow: "0 0 15px #ff0000, 0 0 50px #880000",
                animation: "glitchText 2.5s ease-in-out infinite, hellFlicker 0.5s ease-in-out infinite",
                userSelect: "none", whiteSpace: "nowrap",
                transform: "translateX(-50%)",
              }}>
                ☠ UNDERGROUND MARKET ☠
              </div>
            )}

            {/* Vignette */}
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
              background: "radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.75) 100%)",
              pointerEvents: "none",
            }} />
          </>
        )}
      </div>
    </>,
    document.body
  );

  return (
    <TransitionContext.Provider value={{ navigateWithScare }}>
      {children}
      {overlay}
    </TransitionContext.Provider>
  );
}

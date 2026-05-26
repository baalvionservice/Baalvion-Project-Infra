"use client";

import { useEffect, useState } from "react";
import { isMobileDevice, shouldReduceMotion } from "@/lib/performance";

interface MobilePerformanceWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export function MobilePerformanceWrapper({
  children,
  className = "",
}: MobilePerformanceWrapperProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    setIsMobile(isMobileDevice());
    setReduceMotion(shouldReduceMotion());

    // Optimize for mobile performance
    if (isMobileDevice()) {
      // Reduce animation duration on mobile
      document.documentElement.style.setProperty(
        "--animation-duration",
        "0.2s"
      );

      // Add mobile-specific optimizations
      document.body.classList.add("mobile-optimized");
    }

    return () => {
      document.body.classList.remove("mobile-optimized");
    };
  }, []);

  const wrapperClass = `
    ${className}
    ${isMobile ? "mobile-optimized" : ""}
    ${reduceMotion ? "motion-reduced" : ""}
  `.trim();

  return <div className={wrapperClass}>{children}</div>;
}

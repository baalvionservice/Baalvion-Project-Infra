"use client"

import { useState } from "react"

// A club photo that never shows a broken-image icon: a missing or dead URL falls back to a
// plain tile with the club's initial, so listings still look intentional.
export function ClubPhoto({ src, name, className = "" }: { src?: string | null; name: string; className?: string }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-[#1b1b24] to-[#0b0b10] text-white/30 font-black text-6xl select-none ${className}`} role="img" aria-label={name}>
        {name.charAt(0).toUpperCase()}
      </div>
    )
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={name} className={className} onError={() => setFailed(true)} />
}

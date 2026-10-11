"use client"

import { useState } from "react"
import { Share2 } from "lucide-react"

export function ShareButton({ title, path }: { title: string; path: string }) {
  const [copied, setCopied] = useState(false)
  const share = async () => {
    const url = `${window.location.origin}${path}`
    try {
      if (navigator.share) { await navigator.share({ title, url }); return }
      await navigator.clipboard.writeText(url)
      setCopied(true); setTimeout(() => setCopied(false), 1800)
    } catch { /* cancelled or blocked */ }
  }
  return (
    <button onClick={share} className="inline-flex items-center gap-2 px-5 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition">
      <Share2 className="w-4 h-4 text-[#ed6c2a]" /> {copied ? "Link copied" : "Share"}
    </button>
  )
}

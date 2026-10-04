"use client"

import { useRef, useState } from "react"
import { uploadImage, type UploadPurpose } from "@/lib/api/media"

interface Props {
  value: string
  onChange: (url: string) => void
  purpose: UploadPurpose
  label: string
  /** Light styling for the admin console, dark for the public site. */
  tone?: "light" | "dark"
  allowLink?: boolean
}

export function ImageUpload({ value, onChange, purpose, label, tone = "dark", allowLink = false }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const light = tone === "light"

  const pick = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    setError("")
    try {
      onChange(await uploadImage(file, purpose))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  const label_cls = light ? "block text-sm font-medium text-gray-700 mb-1" : "block text-xs font-bold text-gray-400 uppercase mb-2"
  const btn = light
    ? "px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50 disabled:opacity-60"
    : "px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-sm font-bold hover:bg-white/10 disabled:opacity-60"
  const input_cls = light
    ? "w-full border p-2 rounded-lg text-sm outline-none focus:border-fuchsia-500"
    : "w-full h-10 bg-white/5 border border-white/10 rounded-lg px-3 text-sm outline-none"

  return (
    <div>
      <span className={label_cls}>{label}</span>
      <div className="flex items-center gap-3">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt={label} className="w-16 h-16 rounded-lg object-cover border border-white/10" />
        ) : (
          <div className={`w-16 h-16 rounded-lg border border-dashed flex items-center justify-center text-xs ${light ? "border-gray-300 text-gray-400" : "border-white/20 text-gray-500"}`}>None</div>
        )}
        <div className="space-x-2">
          <button type="button" className={btn} disabled={busy} onClick={() => inputRef.current?.click()}>
            {busy ? "Uploading…" : value ? "Replace photo" : "Upload photo"}
          </button>
          {value && <button type="button" className={btn} onClick={() => onChange("")}>Remove</button>}
        </div>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
      </div>
      {allowLink && (
        <input className={`${input_cls} mt-2`} placeholder="or paste an image link (https://...)" value={value} onChange={(e) => onChange(e.target.value)} />
      )}
      {error && <p role="alert" className={`text-xs mt-1 ${light ? "text-red-600" : "text-red-400"}`}>{error}</p>}
    </div>
  )
}

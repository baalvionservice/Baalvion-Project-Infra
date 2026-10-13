"use client"

import { useRef, useState } from "react"
import { FileText, Trash2, Upload } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { deleteProductMedia, uploadProductMedia, type CommerceProductMedia } from "@/lib/api/commerce-admin"

const MAX_PDFS = 3
const MAX_MB = 10

// PDFs a seller attaches to a listing for buyers. PDF only, up to 3, 10 MB each. They show on the listing's public page.
export function DocumentsField({ storeId, productId, media, onChange }: { storeId: string; productId: string; media: CommerceProductMedia[]; onChange: (m: CommerceProductMedia[]) => void }) {
  const { toast } = useToast()
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const docs = media.filter((m) => m.mediaType === "document")

  const add = async (files: FileList | null) => {
    if (!files) return
    let next = media
    for (const f of Array.from(files)) {
      if (docs.length + (next.length - media.length) >= MAX_PDFS) { toast({ title: `Up to ${MAX_PDFS} PDFs` }); break }
      if (f.type !== "application/pdf") { toast({ variant: "destructive", title: `${f.name} is not a PDF` }); continue }
      if (f.size > MAX_MB * 1024 * 1024) { toast({ variant: "destructive", title: `${f.name} is over ${MAX_MB} MB` }); continue }
      setBusy("upload")
      try { const up = await uploadProductMedia(storeId, productId, f, { mediaType: "document", altText: f.name.replace(/\.pdf$/i, "") }); next = [...next, up]; onChange(next) }
      catch (e) { toast({ variant: "destructive", title: "Upload failed", description: e instanceof Error ? e.message : "Please try again." }) }
      finally { setBusy(null) }
    }
    if (input.current) input.current.value = ""
  }
  const remove = async (id: string) => {
    setBusy(id)
    try { await deleteProductMedia(storeId, productId, id); onChange(media.filter((m) => m.id !== id)) }
    catch (e) { toast({ variant: "destructive", title: "Couldn't remove", description: e instanceof Error ? e.message : "Please try again." }) }
    finally { setBusy(null) }
  }

  return (
    <div className="space-y-3">
      {docs.length > 0 && (
        <ul className="space-y-2">
          {docs.map((d) => (
            <li key={d.id} className="flex items-center gap-3 rounded-lg border border-white/10 px-3 py-2">
              <FileText className="w-4 h-4 text-gray-400 shrink-0" />
              <a href={d.url} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-0 truncate text-sm underline">{d.altText || "PDF"}</a>
              <button type="button" onClick={() => remove(d.id)} disabled={busy === d.id} aria-label="Remove PDF" className="p-2 text-gray-400 hover:text-red-400 disabled:opacity-40"><Trash2 className="w-4 h-4" /></button>
            </li>
          ))}
        </ul>
      )}
      {docs.length < MAX_PDFS && (
        <button type="button" onClick={() => input.current?.click()} disabled={busy === "upload"} className="h-11 px-4 rounded-lg border border-dashed border-white/20 hover:border-white/40 text-sm flex items-center gap-2 disabled:opacity-50"><Upload className="w-4 h-4" /> {busy === "upload" ? "Uploading…" : "Add a PDF"}</button>
      )}
      <input ref={input} type="file" accept="application/pdf" multiple className="hidden" onChange={(e) => void add(e.target.files)} />
      <p className="text-xs text-gray-600">PDF only, up to {MAX_PDFS} files of {MAX_MB} MB. Buyers can open them from your listing page.</p>
    </div>
  )
}

"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { ExternalLink, Plus, Trash2 } from "lucide-react"
import { ImageUpload } from "@/components/upload/image-upload"
import { CMS_PAGES } from "@/lib/cms-pages"
import { cmsAdmin, type PageRow } from "@/lib/api/cms-admin"
import { listDraws } from "@/lib/api/engagement"
import type { SitePage } from "@/lib/cms"

const input = "w-full border p-2.5 rounded-lg outline-none focus:border-fuchsia-500 text-sm"
const blank = (slug: string): SitePage => ({ slug, title: "", seoTitle: "", seoDescription: "", intro: "", body: "", benefits: [], faqs: [], image: "", noindex: false })
const Count = ({ n, max }: { n: number; max: number }) => <span className={`text-xs ${n > max ? "text-red-600" : "text-gray-400"}`}>{n}/{max}</span>

export default function AdminContentPage() {
  const [rows, setRows] = useState<PageRow[]>([])
  const [draws, setDraws] = useState<{ slug: string; label: string; hint: string }[]>([])
  const [slug, setSlug] = useState("clubs")
  const [custom, setCustom] = useState("")
  const [page, setPage] = useState<SitePage | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const loadRows = useCallback(() => { cmsAdmin.list().then(setRows).catch(() => {}) }, [])
  useEffect(() => { loadRows(); listDraws().then((r) => setDraws(r.items.map((d) => ({ slug: `clubs/lottery/${d.id}`, label: `Draw: ${d.title}${d.state ? ` (${d.state})` : ""}`, hint: "Tell people who this draw is for, what they win, why it is worth entering, and anything specific to this city or state." })))).catch(() => {}) }, [loadRows])
  useEffect(() => { setPage(null); setMsg(null); cmsAdmin.get(slug).then((p) => setPage(p ?? blank(slug))).catch((e) => setMsg({ ok: false, text: e.message })) }, [slug])

  const all = useMemo(() => [...CMS_PAGES, ...draws], [draws])
  const current = all.find((p) => p.slug === slug)
  const written = new Set(rows.map((r) => r.slug))
  const set = (patch: Partial<SitePage>) => setPage((p) => (p ? { ...p, ...patch } : p))

  const save = async () => {
    if (!page) return
    setBusy(true); setMsg(null)
    try { await cmsAdmin.save(page); setMsg({ ok: true, text: "Saved. It shows on the live page within a minute." }); loadRows() }
    catch (e) { setMsg({ ok: false, text: e instanceof Error ? e.message : "Could not save" }) } finally { setBusy(false) }
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Page content and SEO</h1>
        <p className="text-gray-500 mt-2">Write what shows in Google (title and description) and the content under each page: an intro, what people get, a longer text and common questions. Pages with nothing written use their built-in text. Plain text only: a blank line starts a new paragraph, <code>## </code> starts a heading, and lines starting with <code>- </code> make a list.</p>
      </div>
      <div className="grid lg:grid-cols-[280px_1fr] gap-6">
        <aside className="bg-white rounded-xl border border-gray-100 p-3 self-start max-h-[75vh] overflow-auto">
          <ul className="space-y-1">
            {all.map((p) => (
              <li key={p.slug}><button onClick={() => setSlug(p.slug)} className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between gap-2 ${slug === p.slug ? "bg-fuchsia-50 text-fuchsia-800 font-semibold" : "hover:bg-gray-50"}`}>
                <span className="truncate">{p.label}</span><span className={`w-2 h-2 rounded-full shrink-0 ${written.has(p.slug) ? "bg-green-500" : "bg-gray-300"}`} title={written.has(p.slug) ? "Written" : "Nothing written yet"} />
              </button></li>
            ))}
          </ul>
          <div className="mt-4 border-t pt-3">
            <p className="text-xs text-gray-500 mb-1">Another page (its path, like <code>forum/join</code>)</p>
            <div className="flex gap-2"><input className={input} value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="path" /><button onClick={() => custom.trim() && setSlug(custom.trim().replace(/^\/+/, ""))} className="px-3 rounded-lg border text-sm">Open</button></div>
          </div>
        </aside>

        <section className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
          {!page ? <p className="text-gray-400 text-sm">Loading…</p> : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><h2 className="text-xl font-semibold">{current?.label ?? slug}</h2><p className="text-xs text-gray-400">/{slug}</p></div>
                <a href={`/${slug}`} target="_blank" rel="noopener noreferrer" className="text-sm underline flex items-center gap-1"><ExternalLink className="w-3.5 h-3.5" /> View page</a>
              </div>
              {current?.hint && <p className="text-sm bg-amber-50 border border-amber-200 text-amber-900 rounded-lg p-3"><b>What to write:</b> {current.hint}</p>}

              <div className="rounded-lg border border-gray-200 p-4 space-y-3">
                <h3 className="font-semibold text-sm">Google search result</h3>
                <label className="block text-sm">Title <Count n={page.seoTitle.length} max={60} /><input className={input} value={page.seoTitle} maxLength={160} onChange={(e) => set({ seoTitle: e.target.value })} placeholder="About 50 to 60 characters, with the main words people search" /></label>
                <label className="block text-sm">Description <Count n={page.seoDescription.length} max={160} /><textarea className={input} rows={3} value={page.seoDescription} maxLength={320} onChange={(e) => set({ seoDescription: e.target.value })} placeholder="One or two sentences, about 150 characters, that make someone click" /></label>
                <div className="text-xs text-gray-500 bg-gray-50 rounded p-3"><div className="text-blue-700 text-base">{page.seoTitle || current?.label || slug}</div><div className="text-green-700">community.marketunderworld.com/{slug}</div><div>{page.seoDescription || "No description yet, the page's built-in one is used."}</div></div>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={page.noindex} onChange={(e) => set({ noindex: e.target.checked })} /> Keep this page out of Google</label>
              </div>

              <label className="block text-sm font-medium">Heading shown above the content (optional)<input className={input} value={page.title} maxLength={160} onChange={(e) => set({ title: e.target.value })} /></label>
              <label className="block text-sm font-medium">Intro (the first paragraph people read)<textarea className={input} rows={3} value={page.intro} maxLength={2000} onChange={(e) => set({ intro: e.target.value })} /></label>

              <div>
                <div className="flex items-center justify-between mb-2"><h3 className="text-sm font-medium">What people get (benefits)</h3><button onClick={() => set({ benefits: [...page.benefits, { title: "", text: "" }] })} className="text-sm flex items-center gap-1 underline"><Plus className="w-3.5 h-3.5" /> Add</button></div>
                <div className="space-y-2">{page.benefits.map((b, i) => (
                  <div key={i} className="grid sm:grid-cols-[1fr_2fr_auto] gap-2"><input className={input} placeholder="Benefit" value={b.title} onChange={(e) => set({ benefits: page.benefits.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })} /><input className={input} placeholder="One sentence of detail" value={b.text} onChange={(e) => set({ benefits: page.benefits.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)) })} /><button onClick={() => set({ benefits: page.benefits.filter((_, j) => j !== i) })} aria-label="Remove" className="p-2 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button></div>
                ))}</div>
              </div>

              <label className="block text-sm font-medium">Longer text<textarea className={`${input} font-mono`} rows={10} value={page.body} maxLength={20000} onChange={(e) => set({ body: e.target.value })} placeholder={"## How it works\n\nWrite in short paragraphs.\n\n- Use a dash for a list\n- Like this"} /></label>

              <div>
                <div className="flex items-center justify-between mb-2"><h3 className="text-sm font-medium">Common questions (also shown to Google)</h3><button onClick={() => set({ faqs: [...page.faqs, { q: "", a: "" }] })} className="text-sm flex items-center gap-1 underline"><Plus className="w-3.5 h-3.5" /> Add</button></div>
                <div className="space-y-3">{page.faqs.map((f, i) => (
                  <div key={i} className="grid gap-2 border border-gray-100 rounded-lg p-3"><div className="flex gap-2"><input className={input} placeholder="Question" value={f.q} onChange={(e) => set({ faqs: page.faqs.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)) })} /><button onClick={() => set({ faqs: page.faqs.filter((_, j) => j !== i) })} aria-label="Remove" className="p-2 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button></div><textarea className={input} rows={2} placeholder="Answer" value={f.a} onChange={(e) => set({ faqs: page.faqs.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)) })} /></div>
                ))}</div>
              </div>

              <ImageUpload tone="light" label="Share image (shown when the page is shared)" purpose="club_image" value={page.image} onChange={(url) => set({ image: url })} />

              {msg && <p role="status" className={`text-sm rounded-lg border px-4 py-3 ${msg.ok ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-700"}`}>{msg.text}</p>}
              <button onClick={save} disabled={busy} className="px-6 py-2.5 rounded-lg bg-fuchsia-600 text-white text-sm font-medium hover:bg-fuchsia-700 disabled:opacity-60">{busy ? "Saving…" : "Save"}</button>
            </>
          )}
        </section>
      </div>
    </div>
  )
}

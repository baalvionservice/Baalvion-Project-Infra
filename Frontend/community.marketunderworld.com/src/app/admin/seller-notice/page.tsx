"use client"

import { useCallback, useEffect, useState } from "react"
import { Megaphone } from "lucide-react"
import { NexusCard } from "@/components/ui/nexus-card"
import { NexusButton } from "@/components/ui/nexus-button"
import { useToast } from "@/hooks/use-toast"
import { announcementsAdmin, type Announcement, type Severity } from "@/lib/api/staff"
import { isSellerNotice, stripSellerTag, withSellerTag } from "@/lib/seller-notice"

const SEVERITIES: { id: Severity; label: string; hint: string }[] = [
  { id: "info", label: "Good news / info", hint: "Blue" },
  { id: "warning", label: "Heads up", hint: "Amber" },
  { id: "critical", label: "Urgent", hint: "Red" },
]

const input = "w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-sm text-white outline-none focus:border-cyan-500/60"

export default function SellerNoticePage() {
  const { toast } = useToast()
  const [current, setCurrent] = useState<Announcement | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [fresh, setFresh] = useState(false) // writing a different notice, not editing the saved one
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [severity, setSeverity] = useState<Severity>("info")
  const [linkUrl, setLinkUrl] = useState("")

  const load = useCallback(async () => {
    try {
      const all = (await announcementsAdmin.list()).filter((a) => isSellerNotice(a.title))
      // One seller notice at a time: the live one if there is one, otherwise the most recent.
      const live = all.find((a) => a.status === "published")
      const latest = live ?? [...all].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))[0] ?? null
      setCurrent(latest)
      if (latest) { setTitle(stripSellerTag(latest.title)); setBody(latest.body); setSeverity(latest.severity); setLinkUrl(latest.linkUrl ?? "") }
    } catch (e) {
      toast({ variant: "destructive", title: "Couldn't load", description: e instanceof Error ? e.message : "Please try again." })
    } finally { setLoading(false) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load() }, [load])

  const startNew = () => { setFresh(true); setTitle(""); setBody(""); setLinkUrl(""); setSeverity("info") }
  const isOn = current?.status === "published" && !fresh
  const ready = title.trim().length > 0 && body.trim().length > 0

  const fields = () => ({ title: withSellerTag(title.trim()), body: body.trim(), severity, linkUrl: linkUrl.trim() || undefined })

  const switchOn = async () => {
    if (!ready) return toast({ variant: "destructive", title: "Write a headline and a message first" })
    setBusy(true)
    try {
      if (current && !fresh) await announcementsAdmin.update(current.id, { ...fields(), linkUrl: linkUrl.trim(), endsAt: null, status: "published" })
      else {
        if (current && current.status === "published") await announcementsAdmin.update(current.id, { status: "archived" })
        const made = await announcementsAdmin.create(fields())
        await announcementsAdmin.update(made.id, { status: "published" })
      }
      toast({ title: "Notice is on", description: "Every seller sees it now." })
      setFresh(false)
      await load()
    } catch (e) {
      toast({ variant: "destructive", title: "Couldn't switch it on", description: e instanceof Error ? e.message : "Please try again." })
    } finally { setBusy(false) }
  }

  const switchOff = async () => {
    if (!current) return
    setBusy(true)
    try {
      await announcementsAdmin.update(current.id, { status: "archived" })
      toast({ title: "Notice is off", description: "Sellers no longer see it. Your text is kept for next time." })
      await load()
    } catch (e) {
      toast({ variant: "destructive", title: "Couldn't switch it off", description: e instanceof Error ? e.message : "Please try again." })
    } finally { setBusy(false) }
  }

  const saveWhileOn = async () => {
    if (!current || !ready) return
    setBusy(true)
    try {
      await announcementsAdmin.update(current.id, { ...fields(), linkUrl: linkUrl.trim() })
      toast({ title: "Notice updated" })
      await load()
    } catch (e) {
      toast({ variant: "destructive", title: "Couldn't save", description: e instanceof Error ? e.message : "Please try again." })
    } finally { setBusy(false) }
  }

  if (loading) return <p className="p-16 text-center text-gray-500">Loading…</p>

  return (
    <div className="p-10 pb-32 max-w-[820px] mx-auto space-y-8">
      <header className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center shrink-0"><Megaphone className="w-6 h-6 text-cyan-400" /></div>
        <div>
          <h1 className="text-3xl font-bold text-white">Seller Notice</h1>
          <p className="text-sm text-gray-500 mt-1">One message to every seller. It shows at the top of their seller pages the moment you switch it on, and disappears when you switch it off.</p>
        </div>
      </header>

      <NexusCard className={`p-6 flex items-center justify-between gap-6 border ${isOn ? "bg-emerald-500/5 border-emerald-500/30" : "bg-white/[0.02] border-white/10"}`}>
        <div>
          <p className="text-lg font-bold text-white">{isOn ? "On: sellers can see it" : "Off: sellers see nothing"}</p>
          <p className="text-xs text-gray-500 mt-1">{isOn ? "Switch it off whenever you like. The text stays saved." : "Write your message below, then switch it on."}</p>
        </div>
        <button role="switch" aria-checked={isOn} aria-label="Seller notice on or off" disabled={busy}
          onClick={isOn ? switchOff : switchOn}
          className={`relative w-20 h-11 rounded-full transition-colors disabled:opacity-50 shrink-0 ${isOn ? "bg-emerald-500" : "bg-white/15"}`}>
          <span className={`absolute top-1 w-9 h-9 rounded-full bg-white transition-all ${isOn ? "left-10" : "left-1"}`} />
        </button>
      </NexusCard>

      <NexusCard className="p-6 bg-white/[0.02] border-white/10 space-y-5">
        <div>
          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Headline</label>
          <input className={input} value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. New week, new rules" />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Message</label>
          <textarea className={input} rows={3} value={body} maxLength={900} onChange={(e) => setBody(e.target.value)} placeholder="What do you want every seller to know?" />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Tone</label>
          <div className="flex flex-wrap gap-2">
            {SEVERITIES.map((s) => (
              <button key={s.id} type="button" onClick={() => setSeverity(s.id)}
                className={`px-4 py-2 rounded-lg text-xs font-bold border transition-colors ${severity === s.id ? "bg-white/10 border-white/25 text-white" : "border-white/10 text-gray-500 hover:text-gray-300"}`}>
                {s.label} <span className="opacity-50">· {s.hint}</span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Link (optional)</label>
          <input className={input} value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="/seller/access or https://…" />
        </div>
        <div className="flex flex-wrap gap-3">
          {isOn && <NexusButton onClick={saveWhileOn} isLoading={busy} disabled={!ready}>Save changes</NexusButton>}
          {current && !fresh && <NexusButton variant="outline" onClick={startNew} disabled={busy}>Write a different notice</NexusButton>}
          {fresh && <NexusButton variant="outline" onClick={() => { setFresh(false); load() }} disabled={busy}>Back to the saved notice</NexusButton>}
        </div>
        {fresh && current?.status === "published" && <p className="text-xs text-amber-400">A notice is live right now. Switching this new one on replaces it.</p>}
      </NexusCard>

      {ready && (
        <section aria-label="Preview" className="space-y-2">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Preview, as a seller sees it</p>
          <div className={`border rounded-xl px-4 py-3 flex items-start gap-3 ${severity === "critical" ? "bg-red-950/60 border-red-500/40 text-red-50" : severity === "warning" ? "bg-amber-950/60 border-amber-500/40 text-amber-50" : "bg-cyan-950/60 border-cyan-500/30 text-cyan-50"}`}>
            <Megaphone className="w-4 h-4 mt-0.5 shrink-0" />
            <div className="text-sm"><strong className="mr-2">{title}</strong><span className="opacity-90">{body}</span>{linkUrl && <span className="ml-2 underline font-semibold">Details</span>}</div>
          </div>
        </section>
      )}
    </div>
  )
}

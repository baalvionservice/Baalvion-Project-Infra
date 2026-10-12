"use client"

import { useEffect, useState } from "react"
import { Check, Copy, ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getMyProfile, saveMyProfile, type MyProfile } from "@/lib/api/profile"
import { SOCIALS } from "@/lib/social"

const inp = "h-10 px-3 rounded-lg bg-black border border-white/10 text-sm text-white w-full"

// A member's own shareable page: a handle, the name and lines to show, and their social links. Off until they switch it on.
export function PublicPageEditor() {
  const { toast } = useToast()
  const [p, setP] = useState<MyProfile | null>(null)
  const [f, setF] = useState({ handle: "", publicName: "", headline: "", knownFor: "", publicProfile: false, searchIndex: true, isFounder: false, companyName: "", roleTitle: "", links: {} as Record<string, string> })
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    getMyProfile().then((m) => { setP(m); setF({ handle: m.handle || "", publicName: m.publicName || "", headline: m.headline || "", knownFor: m.knownFor || "", publicProfile: m.publicProfile, searchIndex: m.searchIndex, isFounder: m.isFounder, companyName: m.companyName || "", roleTitle: m.roleTitle || "", links: m.socialLinks || {} }) }).catch(() => {})
  }, [])
  if (!p) return null

  const url = f.handle ? `${typeof window !== "undefined" ? window.location.origin : ""}/p/${f.handle}` : ""
  const save = async () => {
    setBusy(true)
    try {
      const m = await saveMyProfile({ handle: f.handle.trim().toLowerCase(), publicName: f.publicName.trim(), headline: f.headline.trim(), knownFor: f.knownFor.trim(), socialLinks: f.links, publicProfile: f.publicProfile, searchIndex: f.searchIndex, isFounder: f.isFounder, companyName: f.companyName.trim(), roleTitle: f.roleTitle.trim() })
      setP(m); setF((c) => ({ ...c, handle: m.handle, links: m.socialLinks }))
      toast({ title: "Public page saved", description: m.publicProfile ? "Your link is live." : "Your page is off. Turn it on when you are ready." })
    } catch (e) { toast({ variant: "destructive", title: "Couldn't save", description: e instanceof Error ? e.message : "Please try again." }) } finally { setBusy(false) }
  }
  const copy = async () => { try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch { /* the link is shown on screen */ } }

  return (
    <div className="space-y-4 border-t border-white/5 pt-5">
      <div>
        <h3 className="font-bold text-white">Your public page</h3>
        <p className="text-sm text-gray-500 mt-1">A link you can share, with your photo, a few lines and your social links, so hosts and other members can see who you are. Nothing shows until you switch it on. Once it is on, your profile photo and these details can be seen by anyone with the link. Your email and phone are never shown.</p>
      </div>
      <label className="flex items-center gap-3 text-sm text-gray-200"><input type="checkbox" className="accent-red-500 w-5 h-5" checked={f.publicProfile} onChange={(e) => setF({ ...f, publicProfile: e.target.checked })} /> Show my public page to anyone with the link</label>
      <label className="flex items-start gap-3 text-sm text-gray-200"><input type="checkbox" className="accent-red-500 w-5 h-5 mt-0.5" checked={f.searchIndex} onChange={(e) => setF({ ...f, searchIndex: e.target.checked })} /> <span>Let Google and other search engines list my page, so people can find me by name. Untick to keep it link-only.</span></label>
      <label className="flex items-start gap-3 text-sm text-gray-200"><input type="checkbox" className="accent-red-500 w-5 h-5 mt-0.5" checked={f.isFounder} onChange={(e) => setF({ ...f, isFounder: e.target.checked })} /> <span>I am a founder. List me in the founders directory with my company and role.</span></label>
      {f.isFounder && <div className="grid sm:grid-cols-2 gap-3"><label className="text-xs text-gray-400">Company<input className={`${inp} mt-1`} value={f.companyName} maxLength={120} onChange={(e) => setF({ ...f, companyName: e.target.value })} /></label><label className="text-xs text-gray-400">Your role<input className={`${inp} mt-1`} value={f.roleTitle} maxLength={80} onChange={(e) => setF({ ...f, roleTitle: e.target.value })} placeholder="Founder and CEO" /></label></div>}
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="text-xs text-gray-400">Your link name<div className="flex items-center mt-1"><span className="h-10 px-3 flex items-center rounded-l-lg bg-white/5 border border-r-0 border-white/10 text-xs text-gray-400">/p/</span><input className={`${inp} rounded-l-none`} value={f.handle} maxLength={30} onChange={(e) => setF({ ...f, handle: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "") })} placeholder="priya-dj" /></div></label>
        <label className="text-xs text-gray-400">Name to show<input className={`${inp} mt-1`} value={f.publicName} maxLength={80} onChange={(e) => setF({ ...f, publicName: e.target.value })} placeholder="Priya" /></label>
        <label className="text-xs text-gray-400 sm:col-span-2">One line about you<input className={`${inp} mt-1`} value={f.headline} maxLength={120} onChange={(e) => setF({ ...f, headline: e.target.value })} placeholder="Resident DJ, Mumbai" /></label>
        <label className="text-xs text-gray-400 sm:col-span-2">What you are known for (shows, events, work)<textarea className={`${inp} mt-1 h-24 py-2`} value={f.knownFor} maxLength={600} onChange={(e) => setF({ ...f, knownFor: e.target.value })} /></label>
      </div>
      <div>
        <p className="text-xs text-gray-400 mb-2">Your links. Type a handle or paste the link.</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {SOCIALS.map((s) => (
            <label key={s.key} className="text-xs text-gray-400">{s.label}<input className={`${inp} mt-1`} value={f.links[s.key] || ""} maxLength={300} placeholder={s.placeholder} onChange={(e) => setF({ ...f, links: { ...f.links, [s.key]: e.target.value } })} /></label>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={save} disabled={busy} className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-semibold px-6 py-2.5 rounded-lg">{busy ? "Saving…" : "Save my public page"}</button>
        {url && p.publicProfile && (<>
          <button onClick={copy} className="h-10 px-4 rounded-lg border border-white/15 text-sm flex items-center gap-2">{copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />} {copied ? "Copied" : "Copy link"}</button>
          <a href={`/p/${p.handle}`} target="_blank" rel="noopener noreferrer" className="text-sm underline flex items-center gap-1"><ExternalLink className="w-3.5 h-3.5" /> View</a>
        </>)}
      </div>
    </div>
  )
}

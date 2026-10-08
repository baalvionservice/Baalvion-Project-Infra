"use client"

import { useState } from "react"
import Link from "next/link"
import { Check, Copy, ExternalLink, Pencil } from "lucide-react"
import { NexusCard } from "@/components/ui/nexus-card"
import { useToast } from "@/hooks/use-toast"
import { setMyDisplayName, type MyMember } from "@/lib/api/members"

export function MemberIdCard({ member, onChange }: { member: MyMember; onChange: (m: MyMember) => void }) {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(member.displayName)
  const [saving, setSaving] = useState(false)

  const copy = async () => {
    try { await navigator.clipboard.writeText(member.memberNumber); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch { /* clipboard blocked */ }
  }

  const save = async () => {
    setSaving(true)
    try { onChange(await setMyDisplayName(name)); setEditing(false); toast({ title: "Display name updated" }) }
    catch (e) { toast({ variant: "destructive", title: "Couldn't save", description: e instanceof Error ? e.message : "Please try again." }) }
    finally { setSaving(false) }
  }

  return (
    <NexusCard className="p-6 bg-white/[0.02] border-white/5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 min-w-0">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Your member ID</p>
          <div className="flex items-center gap-3">
            <span className="font-mono text-3xl font-bold text-white tracking-wider">{member.memberNumber}</span>
            <button onClick={copy} aria-label="Copy member ID" className="text-gray-500 hover:text-white transition-colors">
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          {editing ? (
            <div className="flex items-center gap-2 pt-1">
              <input value={name} maxLength={80} onChange={(e) => setName(e.target.value)} aria-label="Display name"
                className="h-9 px-3 rounded-lg bg-black border border-white/10 text-sm text-white w-64" />
              <button onClick={save} disabled={saving} className="text-xs font-bold text-cyan-400 uppercase tracking-widest disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
              <button onClick={() => { setEditing(false); setName(member.displayName) }} className="text-xs font-bold text-gray-500 uppercase tracking-widest">Cancel</button>
            </div>
          ) : (
            <p className="text-sm text-gray-400 flex items-center gap-2">
              Shown to others as <strong className="text-white">{member.displayName}</strong>
              <button onClick={() => setEditing(true)} aria-label="Edit display name" className="text-gray-600 hover:text-white"><Pencil className="w-3.5 h-3.5" /></button>
            </p>
          )}
        </div>
        <div className="flex flex-col items-start md:items-end gap-1 shrink-0">
          <Link href={member.profilePath} className="inline-flex items-center gap-2 text-[11px] font-bold text-cyan-400 uppercase tracking-widest hover:text-cyan-300">
            View public profile <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <span className="font-mono text-[11px] text-gray-600">{member.profilePath}</span>
        </div>
      </div>
    </NexusCard>
  )
}

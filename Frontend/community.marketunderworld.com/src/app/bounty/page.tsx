"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Skull, ShieldAlert, Zap, MessageSquare, Target, Trophy, Lock,
  ChevronRight, Terminal, Eye, Bitcoin, AlertTriangle,
} from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { bounty, type BountyReport, type BountyTask, type ReportStatus } from "@/lib/api/bounty"
import { Navbar } from "@/components/layout/navbar"

const DIFF_COLOR: Record<string, string> = {
  EASY: "text-green-400 bg-green-400/10 border-green-500/30",
  MEDIUM: "text-yellow-400 bg-yellow-400/10 border-yellow-500/30",
  HARD: "text-orange-400 bg-orange-400/10 border-orange-500/30",
  EXPERT: "text-red-400 bg-red-400/10 border-red-500/30",
}

const STATUS_STYLE: Record<ReportStatus, string> = {
  submitted: "text-gray-300 border-gray-500/30 bg-gray-500/10",
  triaged: "text-blue-300 border-blue-500/30 bg-blue-500/10",
  accepted: "text-green-300 border-green-500/30 bg-green-500/10",
  rejected: "text-red-300 border-red-500/30 bg-red-500/10",
  duplicate: "text-orange-300 border-orange-500/30 bg-orange-500/10",
  paid: "text-yellow-300 border-yellow-500/30 bg-yellow-500/10",
}

function ReportModal({ task, onClose, onSubmitted }: { task: BountyTask; onClose: () => void; onSubmitted: () => void }) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [links, setLinks] = useState("")
  const [error, setError] = useState("")
  const [sending, setSending] = useState(false)

  const submit = async () => {
    setError("")
    setSending(true)
    try {
      await bounty.report({
        taskId: task.id,
        title,
        description,
        evidenceLinks: links.split("\n").map((l) => l.trim()).filter(Boolean),
      })
      onSubmitted()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit the report")
    } finally {
      setSending(false)
    }
  }

  const field = "w-full bg-black/60 border border-[#252A33] focus:border-red-500/60 rounded-xl px-4 py-3 text-sm text-white outline-none"
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-[#0D0D12] border border-red-600/40 rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div>
          <h2 className="text-xl font-bold">Report: {task.title}</h2>
          <p className="text-xs text-gray-500 font-mono mt-1">Target: {task.target}</p>
        </div>
        <input className={field} placeholder="Short title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
        <textarea className={field} rows={7} placeholder="What is the issue, what is its impact, and the exact steps to reproduce it?" value={description} onChange={(e) => setDescription(e.target.value)} />
        <textarea className={field} rows={3} placeholder="Evidence links, one per line (screenshots, recordings, gists)" value={links} onChange={(e) => setLinks(e.target.value)} />
        {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-white/10 text-sm text-gray-300 hover:bg-white/5">Cancel</button>
          <button onClick={submit} disabled={sending} className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-60 text-sm font-bold uppercase tracking-widest">{sending ? "Sending..." : "Submit Report"}</button>
        </div>
      </div>
    </div>
  )
}

export default function BountyPage() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [accepted, setAccepted] = useState(false)
  const [tasks, setTasks] = useState<BountyTask[]>([])
  const [reports, setReports] = useState<BountyReport[]>([])
  const [loadError, setLoadError] = useState("")
  const [accepting, setAccepting] = useState(false)
  const [reporting, setReporting] = useState<BountyTask | null>(null)

  const refresh = async () => {
    try {
      setLoadError("")
      const [status, open, mine] = await Promise.all([bounty.status(), bounty.tasks(), bounty.myReports()])
      setAccepted(status.accepted)
      setTasks(open)
      setReports(mine)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not load the program")
    }
  }

  useEffect(() => {
    if (isAuthenticated) refresh()
  }, [isAuthenticated])

  const acceptRules = async () => {
    setAccepting(true)
    try {
      await bounty.accept()
      setAccepted(true)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not record your acceptance")
    } finally {
      setAccepting(false)
    }
  }

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/auth/signin?redirect=/bounty")
  }, [isLoading, isAuthenticated, router])

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const handle = user?.email?.split("@")[0] ?? "Operator"

  return (
    <div className="min-h-screen bg-[#050508] text-white relative overflow-hidden">
      <Navbar />

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-red-700/8 rounded-full blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: "radial-gradient(#ff0000 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
      </div>

      <main className="relative z-10 max-w-5xl mx-auto px-6 pt-36 pb-24 space-y-16">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-red-900 to-black border-2 border-red-600 flex items-center justify-center shadow-[0_0_30px_rgba(220,38,38,0.4)]">
            <Skull className="w-12 h-12 text-red-500 animate-pulse" />
          </div>
          <div>
            <p className="text-red-500/70 font-mono text-xs uppercase tracking-[0.3em] mb-3">Identity Verified ● Clearance Granted</p>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Welcome, <span className="text-red-500 drop-shadow-[0_0_15px_rgba(220,38,38,0.8)]">{handle}</span>
            </h1>
            <p className="text-gray-400 mt-4 text-lg max-w-xl mx-auto">
              You have entered the <strong className="text-white">Market Underworld Bug Bounty Program.</strong> Pick a task, test it within the rules, and submit a report. The admin team reviews every report.
            </p>
          </div>
          <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-red-950/40 border border-red-600/40 rounded-full">
            <ShieldAlert className="w-4 h-4 text-red-500" />
            <span className="text-sm font-bold text-red-400 uppercase tracking-widest">Role: Bounty Hunter</span>
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          </div>
        </motion.div>

        {/* Rewards */}
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-red-950/60 via-black to-red-950/60 border border-red-600/40 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center shrink-0">
            <Bitcoin className="w-8 h-8 text-yellow-500" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-2xl font-bold text-white">Rewards</h2>
            <p className="text-gray-400 text-sm mt-1">Each task lists its reward. Rewards are paid only for reports the admin team accepts, and the payout is arranged with you directly after review.</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span className="text-xs font-bold text-yellow-400 uppercase tracking-widest">Reviewed Reports Only</span>
          </div>
        </motion.div>

        {/* Tasks */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 mb-6">
            <Target className="w-5 h-5 text-red-500" />
            <h2 className="text-xl font-bold uppercase tracking-widest">Active Tasks</h2>
            <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/30 rounded text-xs font-bold text-red-400">{tasks.length} OPEN</span>
          </div>
          {loadError && <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{loadError}</p>}
          {!loadError && tasks.length === 0 && <p className="text-center text-gray-500 py-10">No tasks are open right now.</p>}
          {tasks.map((task, i) => (
            <motion.div key={task.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.08 }}
              className="bg-[#0D0D12] border border-[#1E2028] hover:border-red-600/40 rounded-2xl p-6 flex flex-col sm:flex-row gap-6 group transition-all">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-red-500/5 border border-red-500/20 shrink-0">
                <Terminal className="w-6 h-6 text-red-500" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="font-bold text-white text-lg">{task.title}</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${DIFF_COLOR[task.difficulty]}`}>{task.difficulty}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border border-yellow-500/30 text-yellow-400 bg-yellow-400/5">{task.rewardLabel}</span>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">{task.description}</p>
                {task.rules && <p className="text-xs text-gray-500 leading-relaxed whitespace-pre-wrap"><span className="font-bold text-gray-400">Rules: </span>{task.rules}</p>}
                <div className="flex items-center gap-2 text-xs text-gray-600 font-mono">
                  <Eye className="w-3.5 h-3.5" />Target: <span className="text-gray-400">{task.target}</span>
                </div>
              </div>
              <div className="shrink-0 flex items-center">
                <button
                  onClick={() => setReporting(task)}
                  disabled={!accepted}
                  title={accepted ? undefined : "Accept the rules first"}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all flex items-center gap-2"
                >
                  <Zap className="w-3.5 h-3.5" /> Report
                </button>
              </div>
            </motion.div>
          ))}
        </section>

        {/* CTA */}
        {!accepted ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="bg-[#0D0D12] border border-red-600/30 rounded-2xl p-8 text-center space-y-5">
            <AlertTriangle className="w-10 h-10 text-red-500 mx-auto" />
            <h2 className="text-2xl font-bold">Accept the Challenge?</h2>
            <p className="text-gray-400 text-sm max-w-lg mx-auto">By proceeding you confirm you will test only the targets and methods listed on each task, will not access other users' data, and will report what you find to us privately before sharing it anywhere.</p>
            <button onClick={acceptRules} disabled={accepting}
              className="px-8 py-4 bg-red-600 hover:bg-red-500 text-white font-bold uppercase tracking-widest rounded-xl transition-all text-sm flex items-center gap-3 mx-auto shadow-[0_0_20px_rgba(220,38,38,0.3)]">
              <Skull className="w-5 h-5" /> {accepting ? "Recording..." : "I Accept — Enter the Arena"}
            </button>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-red-950/40 to-black border border-red-500 rounded-2xl p-8 text-center space-y-5 shadow-[0_0_40px_rgba(220,38,38,0.15)]">
            <div className="flex items-center justify-center gap-2 text-red-400 font-bold text-xs uppercase tracking-widest">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />Challenge Accepted
            </div>
            <h2 className="text-2xl font-bold text-white">You&apos;re in.</h2>
            <p className="text-gray-400 text-sm max-w-md mx-auto">Submit findings with the Report button on a task. For questions, message the admin team; replies are not instant. The chat is private between you and the admins.</p>
            <Link href="/bounty/chat">
              <button className="px-8 py-4 bg-red-600 hover:bg-red-500 text-white font-bold uppercase tracking-widest rounded-xl transition-all text-sm flex items-center gap-3 mx-auto shadow-[0_0_20px_rgba(220,38,38,0.5)]">
                <MessageSquare className="w-5 h-5" /> Message the Admins <ChevronRight className="w-4 h-4" />
              </button>
            </Link>
                      </motion.div>
        )}

        {reports.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">My Reports</h2>
            {reports.map((r) => (
              <div key={r.id} className="bg-[#0D0D12] border border-[#1E2028] rounded-2xl p-5 space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-bold">{r.title}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${STATUS_STYLE[r.status]}`}>{r.status}</span>
                  <span className="text-xs text-gray-600">{r.task?.title} · {new Date(r.createdAt).toLocaleDateString()}</span>
                </div>
                {r.reviewerNote && <p className="text-sm text-gray-400"><span className="text-gray-500">Admin: </span>{r.reviewerNote}</p>}
                {r.rewardNote && <p className="text-sm text-yellow-300/80"><span className="text-gray-500">Reward: </span>{r.rewardNote}</p>}
                {r.payout && <p className="text-sm text-yellow-300/80"><span className="text-gray-500">Paid: </span>{r.payout.amount} {r.payout.currency} via {r.payout.method.replace("_", " ")} · ref {r.payout.reference}</p>}
              </div>
            ))}
          </section>
        )}

        {reporting && <ReportModal task={reporting} onClose={() => setReporting(null)} onSubmitted={refresh} />}

        {/* How it works */}
        <section className="border-t border-white/5 pt-12 space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 text-center">How the Bounty Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { step: "01", title: "Pick a Task", desc: "Choose any active task matching your skill level.", icon: Target },
              { step: "02", title: "Exploit & Document", desc: "Execute the attack, capture proof (screenshots, request dumps).", icon: Lock },
              { step: "03", title: "Submit a Report", desc: "Describe how to reproduce it and link your evidence. You can follow its status here.", icon: MessageSquare },
            ].map((s) => (
              <div key={s.step} className="bg-[#0D0D12] border border-[#1E2028] rounded-2xl p-6 space-y-3">
                <div className="text-4xl font-black text-red-900">{s.step}</div>
                <s.icon className="w-5 h-5 text-red-500" />
                <h3 className="font-bold text-white">{s.title}</h3>
                <p className="text-sm text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

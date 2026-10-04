"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  bountyAdmin, type BountyReport, type BountyTask, type Difficulty, type PayoutMethod, type ReportStatus,
  type ThreadMessage, type ThreadSummary,
} from "@/lib/api/bounty";

type Tab = "tasks" | "reports" | "inbox";

const box = "bg-white rounded-xl shadow-sm border border-gray-100";
const input = "w-full border p-2.5 rounded-lg outline-none focus:border-fuchsia-500 text-sm";
const msg = (e: unknown, fallback: string) => (e instanceof Error ? e.message : fallback);

function TasksTab({ onError }: { onError: (m: string) => void }) {
  const [tasks, setTasks] = useState<BountyTask[]>([]);
  const [form, setForm] = useState({ title: "", target: "", difficulty: "MEDIUM" as Difficulty, rewardLabel: "", description: "", rules: "" });

  const load = useCallback(() => bountyAdmin.tasks().then(setTasks).catch((e) => onError(msg(e, "Could not load tasks"))), [onError]);
  useEffect(() => { load(); }, [load]);

  const create = async () => {
    try {
      await bountyAdmin.createTask({ ...form, rules: form.rules || null });
      setForm({ title: "", target: "", difficulty: "MEDIUM", rewardLabel: "", description: "", rules: "" });
      await load();
    } catch (e) { onError(msg(e, "Could not create task")); }
  };
  const setStatus = async (t: BountyTask, status: BountyTask["status"]) => {
    if (status === "open" && !t.rules && !confirm("This task has no rules/scope text. Publish anyway?")) return;
    try { await bountyAdmin.updateTask(t.id, { status }); await load(); } catch (e) { onError(msg(e, "Could not update task")); }
  };

  return (
    <div className="space-y-6">
      <div className={`${box} p-6 space-y-3`}>
        <h2 className="font-semibold">New task (created as draft)</h2>
        <div className="grid md:grid-cols-2 gap-3">
          <input className={input} placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <input className={input} placeholder="Target (URL or area)" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} />
          <select className={input} value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value as Difficulty })}>
            {["EASY", "MEDIUM", "HARD", "EXPERT"].map((d) => <option key={d}>{d}</option>)}
          </select>
          <input className={input} placeholder="Reward label (only what you will actually pay)" value={form.rewardLabel} onChange={(e) => setForm({ ...form, rewardLabel: e.target.value })} />
        </div>
        <textarea className={input} rows={3} placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <textarea className={input} rows={3} placeholder="Rules and scope: what is allowed, what is out of bounds" value={form.rules} onChange={(e) => setForm({ ...form, rules: e.target.value })} />
        <button onClick={create} className="px-5 py-2.5 rounded-lg bg-fuchsia-600 text-white text-sm font-medium hover:bg-fuchsia-700">Create draft</button>
      </div>

      <div className={`${box} divide-y divide-gray-50`}>
        {tasks.map((t) => (
          <div key={t.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="font-medium">{t.title} <span className="text-xs text-gray-500">· {t.difficulty} · {t.rewardLabel}</span></div>
              <div className="text-sm text-gray-500">{t.target}</div>
              {!t.rules && <div className="text-xs text-amber-600 mt-1">No rules/scope text yet</div>}
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-md text-xs font-semibold uppercase ${t.status === "open" ? "bg-green-100 text-green-800" : t.status === "draft" ? "bg-gray-100 text-gray-600" : "bg-red-100 text-red-800"}`}>{t.status}</span>
              {t.status !== "open" && <button onClick={() => setStatus(t, "open")} className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium">Publish</button>}
              {t.status === "open" && <button onClick={() => setStatus(t, "closed")} className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium">Close</button>}
            </div>
          </div>
        ))}
        {tasks.length === 0 && <p className="p-6 text-center text-gray-400 text-sm">No tasks yet.</p>}
      </div>
    </div>
  );
}

function ReportsTab({ onError }: { onError: (m: string) => void }) {
  const [reports, setReports] = useState<BountyReport[]>([]);
  const [filter, setFilter] = useState<ReportStatus | "all">("submitted");
  const [note, setNote] = useState<Record<string, string>>({});
  const [reward, setReward] = useState<Record<string, string>>({});
  const [paying, setPaying] = useState<string | null>(null);
  const [payout, setPayout] = useState({ method: "usdt" as PayoutMethod, amount: "", currency: "USDT", reference: "" });

  const load = useCallback(
    () => bountyAdmin.reports(filter === "all" ? undefined : filter).then(setReports).catch((e) => onError(msg(e, "Could not load reports"))),
    [filter, onError],
  );
  useEffect(() => { load(); }, [load]);

  const decide = async (r: BountyReport, status: Exclude<ReportStatus, "submitted">) => {
    if (status === "paid" && paying !== r.id) { setPaying(r.id); return; }
    try {
      await bountyAdmin.review(r.id, {
        status, reviewerNote: note[r.id] || undefined, rewardNote: reward[r.id] || undefined,
        ...(status === "paid" ? { payout: { method: payout.method, amount: Number(payout.amount), currency: payout.currency, reference: payout.reference } } : {}),
      });
      setPaying(null);
      await load();
    } catch (e) { onError(msg(e, "Could not save decision")); }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {(["submitted", "triaged", "accepted", "rejected", "duplicate", "paid", "all"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-sm capitalize border ${filter === f ? "bg-fuchsia-600 text-white border-fuchsia-600" : "bg-white border-gray-200 text-gray-600"}`}>{f}</button>
        ))}
      </div>
      {reports.length === 0 && <p className={`${box} p-8 text-center text-gray-400 text-sm`}>No reports.</p>}
      {reports.map((r) => (
        <div key={r.id} className={`${box} p-5 space-y-3`}>
          <div className="flex flex-wrap justify-between gap-2">
            <div>
              <div className="font-semibold">{r.title}</div>
              <div className="text-xs text-gray-500">{r.task?.title} · by {r.reporter ?? r.userId} · {new Date(r.createdAt).toLocaleString("en-IN")}</div>
            </div>
            <span className="px-2 py-1 h-fit rounded-md text-xs font-semibold uppercase bg-gray-100">{r.status}</span>
          </div>
          <p className="text-sm whitespace-pre-wrap">{r.description}</p>
          {r.evidenceLinks.length > 0 && (
            <ul className="text-sm space-y-1">{r.evidenceLinks.map((l) => <li key={l}><a href={l} target="_blank" rel="noopener noreferrer nofollow" className="text-blue-600 underline break-all">{l}</a></li>)}</ul>
          )}
          <div className="grid md:grid-cols-2 gap-3">
            <input className={input} placeholder="Note to reporter (required to reject / mark duplicate)" value={note[r.id] ?? r.reviewerNote ?? ""} onChange={(e) => setNote({ ...note, [r.id]: e.target.value })} />
            <input className={input} placeholder="Reward note shown to the reporter (optional)" value={reward[r.id] ?? r.rewardNote ?? ""} onChange={(e) => setReward({ ...reward, [r.id]: e.target.value })} />
          </div>
          {r.payout && (
            <p className="text-sm rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-green-800">
              Paid {r.payout.amount} {r.payout.currency} via {r.payout.method.replace("_", " ")} · ref {r.payout.reference}{r.payout.paidAt ? ` · ${new Date(r.payout.paidAt).toLocaleDateString("en-IN")}` : ""}
            </p>
          )}
          {paying === r.id && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
              <p className="text-xs text-amber-800">This site does not send money. Pay the reporter first, then record the payment here. A paid record cannot be changed.</p>
              <div className="grid md:grid-cols-4 gap-2">
                <select className={input} value={payout.method} onChange={(e) => setPayout({ ...payout, method: e.target.value as PayoutMethod })}>{(["usdt", "btc", "bank_transfer", "upi", "other"] as const).map((m) => <option key={m} value={m}>{m.replace("_", " ")}</option>)}</select>
                <input className={input} type="number" placeholder="Amount" value={payout.amount} onChange={(e) => setPayout({ ...payout, amount: e.target.value })} />
                <input className={input} placeholder="Currency (USDT, INR…)" value={payout.currency} onChange={(e) => setPayout({ ...payout, currency: e.target.value })} />
                <input className={input} placeholder="Transaction id / receipt ref" value={payout.reference} onChange={(e) => setPayout({ ...payout, reference: e.target.value })} />
              </div>
              <div className="flex gap-2">
                <button onClick={() => decide(r, "paid")} className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium">Confirm payout recorded</button>
                <button onClick={() => setPaying(null)} className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium">Cancel</button>
              </div>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {(["triaged", "accepted", "rejected", "duplicate", "paid"] as const).filter((s) => s !== r.status && r.status !== "paid").map((s) => (
              <button key={s} onClick={() => decide(r, s)} className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium capitalize hover:bg-gray-50">{s === "paid" ? "Mark paid" : s}</button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function InboxTab({ onError }: { onError: (m: string) => void }) {
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [active, setActive] = useState<ThreadSummary | null>(null);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [text, setText] = useState("");
  const lastAt = useRef<string | undefined>(undefined);

  const loadThreads = useCallback(() => bountyAdmin.threads().then(setThreads).catch((e) => onError(msg(e, "Could not load inbox"))), [onError]);

  useEffect(() => {
    loadThreads();
    const t = setInterval(loadThreads, 10000);
    return () => clearInterval(t);
  }, [loadThreads]);

  useEffect(() => {
    if (!active) return;
    let stopped = false;
    setMessages([]);
    lastAt.current = undefined;
    const tick = async () => {
      try {
        const next = await bountyAdmin.thread(active.userId, lastAt.current);
        if (stopped || !next.length) return;
        setMessages((prev) => {
          const seen = new Set(prev.map((m) => m.id));
          return [...prev, ...next.filter((m) => !seen.has(m.id))];
        });
        lastAt.current = next[next.length - 1].createdAt;
      } catch (e) { if (!stopped) onError(msg(e, "Could not load thread")); }
    };
    tick();
    const t = setInterval(tick, 5000);
    return () => { stopped = true; clearInterval(t); };
  }, [active, onError]);

  const reply = async () => {
    if (!active || !text.trim()) return;
    try {
      const sent = await bountyAdmin.reply(active.userId, text.trim());
      setMessages((prev) => [...prev, sent]);
      lastAt.current = sent.createdAt;
      setText("");
      loadThreads();
    } catch (e) { onError(msg(e, "Could not send")); }
  };

  return (
    <div className={`${box} grid md:grid-cols-3 min-h-[420px]`}>
      <div className="border-r border-gray-100 divide-y divide-gray-50 overflow-y-auto max-h-[560px]">
        {threads.length === 0 && <p className="p-6 text-sm text-gray-400 text-center">No conversations yet.</p>}
        {threads.map((t) => (
          <button key={t.userId} onClick={() => setActive(t)} className={`w-full text-left p-4 hover:bg-gray-50 ${active?.userId === t.userId ? "bg-fuchsia-50" : ""}`}>
            <div className="flex justify-between"><span className="font-medium text-sm">{t.hunter ?? t.userId.slice(0, 8)}</span>{t.unread > 0 && <span className="text-xs bg-fuchsia-600 text-white rounded-full px-2">{t.unread}</span>}</div>
            <div className="text-xs text-gray-500 truncate">{t.lastMessage}</div>
          </button>
        ))}
      </div>
      <div className="md:col-span-2 flex flex-col">
        {!active ? <p className="m-auto text-sm text-gray-400">Select a conversation.</p> : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[480px]">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.fromAdmin ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] px-3 py-2 rounded-xl text-sm whitespace-pre-wrap break-words ${m.fromAdmin ? "bg-fuchsia-600 text-white" : "bg-gray-100"}`}>{m.content}</div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-gray-100 flex gap-2">
              <input className={input} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && reply()} placeholder="Reply as Admin..." maxLength={4000} />
              <button onClick={reply} className="px-5 rounded-lg bg-fuchsia-600 text-white text-sm font-medium hover:bg-fuchsia-700">Send</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function AdminBountyPage() {
  const [tab, setTab] = useState<Tab>("reports");
  const [error, setError] = useState("");
  const onError = useCallback((m: string) => setError(m), []);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Bug Bounty</h1>
        <p className="text-gray-500 mt-2">Tasks stay hidden until published. Rewards are paid by you, outside this system; mark a report Paid only after paying and note how.</p>
      </div>
      <div className="flex gap-2 mb-6">
        {(["reports", "tasks", "inbox"] as const).map((t) => (
          <button key={t} onClick={() => { setError(""); setTab(t); }} className={`px-5 py-2 rounded-lg text-sm font-medium capitalize border ${tab === t ? "bg-fuchsia-600 text-white border-fuchsia-600" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}>{t}</button>
        ))}
      </div>
      {error && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {tab === "tasks" && <TasksTab onError={onError} />}
      {tab === "reports" && <ReportsTab onError={onError} />}
      {tab === "inbox" && <InboxTab onError={onError} />}
    </div>
  );
}

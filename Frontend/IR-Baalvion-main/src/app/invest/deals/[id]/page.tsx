'use client';

import { useEffect, useState, useCallback, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Loader2, MessageSquare, Lock, FileSearch, FileSignature, Landmark,
  Send, ShieldCheck, CheckCircle2, Plus, FileText,
} from 'lucide-react';

type Tab = 'chat' | 'dataroom' | 'dd' | 'terms' | 'escrow';
const money = (v: unknown) => { const n = Number(v); return v && Number.isFinite(n) ? (n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : `$${n.toLocaleString()}`) : '—'; };

export default function DealRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [tab, setTab] = useState<Tab>('chat');
  const [deal, setDeal] = useState<any>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'unauth' | 'error'>('loading');
  const [data, setData] = useState<any>({ messages: [], nda: [], documents: null, docRequests: [], dd: null, terms: [], escrow: [], signatures: [] });
  const [busy, setBusy] = useState('');

  const call = useCallback(async (path: string, method = 'GET', body?: unknown) => {
    const res = await fetch(`/api/mp/deals/${id}${path}`, {
      method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined,
    });
    if (res.status === 401) { setState('unauth'); throw new Error('unauth'); }
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, json };
  }, [id]);

  const load = useCallback(async () => {
    try {
      const d = await call('');
      if (!d.ok) { setState(d.status === 404 ? 'error' : 'error'); return; }
      setDeal(d.json.data);
      const [msgs, nda, docReqs, dd, terms, escrow, sigs] = await Promise.all([
        call('/messages'), call('/nda'), call('/document-requests'), call('/due-diligence'), call('/term-sheets'), call('/escrow'), call('/signatures'),
      ]);
      const docsRes = await call('/documents');
      setData({
        messages: msgs.json.data ?? [], nda: nda.json.data ?? [], docRequests: docReqs.json.data ?? [],
        dd: dd.json.data ?? { items: [], progress: { pct: 0, total: 0, complete: 0 } },
        terms: terms.json.data ?? [], escrow: escrow.json.data ?? [], signatures: sigs.json.data ?? [],
        documents: docsRes.ok ? (docsRes.json.data ?? []) : null, // null = locked
      });
      setState('ready');
    } catch { /* unauth handled */ }
  }, [call]);

  useEffect(() => { load(); }, [load]);

  const act = async (label: string, fn: () => Promise<unknown>) => { setBusy(label); try { await fn(); await load(); } finally { setBusy(''); } };

  if (state === 'loading') return <Center><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></Center>;
  if (state === 'unauth') return <Center><div className="text-center"><Lock className="mx-auto h-10 w-10 text-gray-300" /><p className="mt-3 font-semibold">Sign in as an investor</p><Link href={`/invest/deals/${id}?login=1`} className="mt-4 inline-block rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white">Sign in</Link></div></Center>;
  if (state === 'error' || !deal) return <Center><div className="text-center text-gray-500">Deal not found.<div className="mt-3"><Link href="/invest/deals" className="text-primary">Back to pipeline</Link></div></div></Center>;

  const ndaSigned = data.nda.length > 0;
  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'chat', label: 'Discussion', icon: MessageSquare },
    { key: 'dataroom', label: 'Data Room', icon: Lock },
    { key: 'dd', label: 'Due Diligence', icon: FileSearch },
    { key: 'terms', label: 'Term Sheet', icon: FileSignature },
    { key: 'escrow', label: 'Signing & Escrow', icon: Landmark },
  ];

  return (
    <div className="min-h-screen bg-white text-[#1d1d1f]">
      <nav className="border-b border-gray-100">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between px-6 py-3 text-[12px]">
          <Link href="/invest/deals" className="inline-flex items-center gap-1 text-primary hover:underline"><ArrowLeft className="h-3.5 w-3.5" /> My pipeline</Link>
          <span className="rounded-full bg-gray-100 px-3 py-1 font-semibold capitalize text-gray-600">{String(deal.status).replace(/_/g, ' ')}</span>
        </div>
      </nav>

      <div className="mx-auto max-w-[1100px] px-6 py-8">
        <h1 className="text-2xl font-bold tracking-tight">Deal Room</h1>
        <p className="text-sm text-gray-500">Everything for this investment happens here — securely, in one place.</p>

        <div className="mt-6 flex flex-wrap gap-1 border-b border-gray-200">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${tab === t.key ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-black'}`}>
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </div>

        <div className="py-6">
          {tab === 'chat' && <Chat messages={data.messages} onSend={(body: string) => act('msg', () => call('/messages', 'POST', { body }))} busy={busy === 'msg'} />}

          {tab === 'dataroom' && (
            <DataRoom
              ndaSigned={ndaSigned} documents={data.documents} requests={data.docRequests}
              onSignNda={() => act('nda', () => call('/nda', 'POST', {}))}
              onRequest={(category: string, title: string) => act('req', () => call('/document-requests', 'POST', { category, title }))}
              busy={busy}
            />
          )}

          {tab === 'dd' && (
            <DueDiligence
              dd={data.dd}
              onAdd={(category: string, item: string) => act('dd', () => call('/due-diligence', 'POST', { category, item }))}
              onComplete={(itemId: string) => act('ddc' + itemId, () => call(`/due-diligence/${itemId}`, 'PATCH', { status: 'complete' }))}
              busy={busy}
            />
          )}

          {tab === 'terms' && (
            <TermSheets
              terms={data.terms}
              onPropose={(b: any) => act('ts', () => call('/term-sheets', 'POST', b))}
              onAction={(tsId: string, action: string, b: any) => act('tsa', () => call(`/term-sheets/${tsId}/versions`, 'POST', { action, ...b }))}
              busy={busy}
            />
          )}

          {tab === 'escrow' && (
            <Escrow
              signatures={data.signatures} escrow={data.escrow}
              onSign={() => act('sig', () => call('/signatures', 'POST', { document_type: 'spa', provider: 'docusign' }))}
              onSignComplete={(sid: string) => act('sigc', () => call(`/signatures/${sid}/complete`, 'POST', {}))}
              onInitiate={(amount: number) => act('esc', () => call('/escrow', 'POST', { amount }))}
              onFund={(eid: string) => act('fund', () => call(`/escrow/${eid}/fund`, 'POST', {}))}
              busy={busy}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-[60vh] items-center justify-center bg-white px-6">{children}</div>;
}

function Chat({ messages, onSend, busy }: any) {
  const [text, setText] = useState('');
  return (
    <div>
      <div className="max-h-[420px] space-y-3 overflow-y-auto rounded-2xl border border-gray-200 bg-gray-50 p-5">
        {messages.length === 0 && <p className="text-center text-sm text-gray-400">No messages yet. Start the conversation.</p>}
        {messages.map((m: any) => (
          <div key={m.id} className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${m.kind === 'system' ? 'mx-auto bg-gray-200 text-gray-600' : m.sender_id === 'user' ? 'ml-auto bg-primary text-white' : 'bg-white border border-gray-200'}`}>
            {m.kind !== 'system' && <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider opacity-60">{m.sender_id}</p>}
            {m.body}
          </div>
        ))}
      </div>
      <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (text.trim()) { onSend(text.trim()); setText(''); } }}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message…" className="flex-1 rounded-full border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:outline-none" />
        <button disabled={busy} className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send
        </button>
      </form>
    </div>
  );
}

function DataRoom({ ndaSigned, documents, requests, onSignNda, onRequest, busy }: any) {
  const [cat, setCat] = useState('financial'); const [title, setTitle] = useState('');
  const locked = documents === null;
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-gray-200 p-6">
        <h3 className="flex items-center gap-2 font-semibold">{locked ? <Lock className="h-4 w-4 text-amber-500" /> : <ShieldCheck className="h-4 w-4 text-green-600" />} Data Room {locked ? '— Locked' : '— Unlocked'}</h3>
        {locked ? (
          <>
            <p className="mt-2 text-sm text-gray-600">Sign the mutual NDA to unlock the company&apos;s confidential documents.</p>
            <button disabled={busy === 'nda'} onClick={onSignNda} className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
              {busy === 'nda' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSignature className="h-4 w-4" />} Sign NDA &amp; unlock
            </button>
          </>
        ) : (
          <ul className="mt-4 space-y-2">
            {documents.length === 0 && <p className="text-sm text-gray-400">No documents shared yet. Request what you need →</p>}
            {documents.map((d: any) => (
              <li key={d.id} className="flex items-center gap-2 rounded-lg border border-gray-100 px-3 py-2 text-sm"><FileText className="h-4 w-4 text-gray-400" /><span className="truncate">{d.file_url.split('/').pop()}</span><span className="ml-auto text-xs text-gray-400">v{d.version}</span></li>
            ))}
          </ul>
        )}
        {ndaSigned && <p className="mt-3 text-xs text-green-600">✓ NDA signed</p>}
      </div>

      <div className="rounded-2xl border border-gray-200 p-6">
        <h3 className="font-semibold">Request documents</h3>
        <p className="mt-1 text-xs text-gray-500">Ask the company for specific diligence materials.</p>
        <form className="mt-4 space-y-3" onSubmit={(e) => { e.preventDefault(); if (title.trim()) { onRequest(cat, title.trim()); setTitle(''); } }}>
          <select value={cat} onChange={(e) => setCat(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
            {['financial', 'legal', 'operational', 'compliance', 'tax'].map((c) => <option key={c} value={c}>{c[0].toUpperCase() + c.slice(1)}</option>)}
          </select>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Audited FY25 financials" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          <button disabled={busy === 'req'} className="inline-flex items-center gap-1.5 rounded-full bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{busy === 'req' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Request</button>
        </form>
        <ul className="mt-4 space-y-2">
          {requests.map((r: any) => (
            <li key={r.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-sm"><span>{r.title}</span><span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs capitalize text-gray-600">{r.status}</span></li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function DueDiligence({ dd, onAdd, onComplete, busy }: any) {
  const [cat, setCat] = useState('financial'); const [item, setItem] = useState('');
  return (
    <div>
      <div className="mb-5 rounded-2xl border border-gray-200 p-5">
        <div className="flex items-center justify-between text-sm"><span className="font-semibold">Diligence progress</span><span className="text-gray-500">{dd.progress.complete}/{dd.progress.total} complete</span></div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${dd.progress.pct}%` }} /></div>
      </div>
      <form className="mb-5 flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); if (item.trim()) { onAdd(cat, item.trim()); setItem(''); } }}>
        <select value={cat} onChange={(e) => setCat(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">{['financial', 'legal', 'operational', 'compliance', 'tax'].map((c) => <option key={c} value={c}>{c[0].toUpperCase() + c.slice(1)}</option>)}</select>
        <input value={item} onChange={(e) => setItem(e.target.value)} placeholder="Add a diligence item…" className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <button disabled={busy === 'dd'} className="inline-flex items-center gap-1.5 rounded-full bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"><Plus className="h-4 w-4" /> Add</button>
      </form>
      <ul className="space-y-2">
        {dd.items.length === 0 && <p className="text-sm text-gray-400">No diligence items yet.</p>}
        {dd.items.map((it: any) => (
          <li key={it.id} className="flex items-center gap-3 rounded-lg border border-gray-100 px-4 py-3 text-sm">
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs capitalize text-gray-500">{it.category}</span>
            <span className={it.status === 'complete' ? 'text-gray-400 line-through' : ''}>{it.item}</span>
            <div className="ml-auto">
              {it.status === 'complete' ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600"><CheckCircle2 className="h-4 w-4" /> Done</span>
                : <button disabled={busy === 'ddc' + it.id} onClick={() => onComplete(it.id)} className="rounded-full border border-gray-300 px-3 py-1 text-xs font-semibold hover:border-primary hover:text-primary">Mark complete</button>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TermSheets({ terms, onPropose, onAction, busy }: any) {
  const [f, setF] = useState({ amount: '2000000', equity_pct: '16.7', valuation: '12000000', note: '' });
  const sheet = terms[0];
  return (
    <div>
      {!sheet ? (
        <form className="max-w-md space-y-3 rounded-2xl border border-gray-200 p-6" onSubmit={(e) => { e.preventDefault(); onPropose({ amount: Number(f.amount), equity_pct: Number(f.equity_pct), valuation: Number(f.valuation), note: f.note }); }}>
          <h3 className="font-semibold">Propose a term sheet</h3>
          {[['amount', 'Investment amount'], ['equity_pct', 'Equity %'], ['valuation', 'Valuation']].map(([k, lbl]) => (
            <div key={k}><label className="text-xs font-medium text-gray-500">{lbl}</label><input value={(f as any)[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
          ))}
          <input value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="Note (optional)" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          <button disabled={busy === 'ts'} className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{busy === 'ts' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSignature className="h-4 w-4" />} Propose</button>
        </form>
      ) : (
        <div className="rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between"><h3 className="font-semibold">Term sheet</h3><span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold capitalize text-gray-600">{sheet.status}</span></div>
          <ol className="mt-4 space-y-3">
            {(sheet.versions ?? []).map((v: any) => (
              <li key={v.id} className="rounded-lg border border-gray-100 p-3 text-sm">
                <div className="flex items-center justify-between"><span className="font-semibold">v{v.version} · {v.action}</span><span className="text-xs text-gray-400">{money(v.amount)} · {v.equity_pct ?? '—'}% · {money(v.valuation)}</span></div>
                {v.note && <p className="mt-1 text-xs text-gray-500">{v.note}</p>}
              </li>
            ))}
          </ol>
          {!['accepted', 'rejected'].includes(sheet.status) && (
            <div className="mt-4 flex gap-2">
              <button disabled={busy === 'tsa'} onClick={() => onAction(sheet.id, 'accept', { note: 'Agreed' })} className="rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">Accept</button>
              <button disabled={busy === 'tsa'} onClick={() => onAction(sheet.id, 'counter', { valuation: 14000000, equity_pct: 14.3, note: 'Counter' })} className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold">Counter</button>
              <button disabled={busy === 'tsa'} onClick={() => onAction(sheet.id, 'reject', { note: 'Declined' })} className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-red-600">Reject</button>
            </div>
          )}
          {sheet.status === 'accepted' && <p className="mt-4 text-sm font-semibold text-green-600">✓ Terms accepted — proceed to signing &amp; escrow.</p>}
        </div>
      )}
    </div>
  );
}

function Escrow({ signatures, escrow, onSign, onSignComplete, onInitiate, onFund, busy }: any) {
  const spa = signatures.find((s: any) => s.document_type === 'spa');
  const esc = escrow[0];
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-gray-200 p-6">
        <h3 className="flex items-center gap-2 font-semibold"><FileSignature className="h-4 w-4 text-primary" /> Sign the SPA</h3>
        {!spa ? (
          <button disabled={busy === 'sig'} onClick={onSign} className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{busy === 'sig' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSignature className="h-4 w-4" />} Start e-signature</button>
        ) : spa.status === 'signed' ? (
          <p className="mt-3 text-sm font-semibold text-green-600">✓ SPA signed</p>
        ) : (
          <button disabled={busy === 'sigc'} onClick={() => onSignComplete(spa.id)} className="mt-4 inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{busy === 'sigc' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Complete signature ({spa.provider})</button>
        )}
      </div>
      <div className="rounded-2xl border border-gray-200 p-6">
        <h3 className="flex items-center gap-2 font-semibold"><Landmark className="h-4 w-4 text-primary" /> Escrow funding</h3>
        {!esc ? (
          <button disabled={busy === 'esc'} onClick={() => onInitiate(2000000)} className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{busy === 'esc' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Landmark className="h-4 w-4" />} Initiate escrow</button>
        ) : (
          <div className="mt-3 space-y-3">
            <p className="text-sm">Amount: <b>{money(esc.amount)}</b> · <span className="capitalize">{esc.status}</span></p>
            {esc.status === 'initiated' && <button disabled={busy === 'fund'} onClick={() => onFund(esc.id)} className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{busy === 'fund' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Landmark className="h-4 w-4" />} Fund escrow</button>}
            {esc.status === 'funded' && <p className="text-sm text-amber-600">⏳ Funded — awaiting compliance release. Ownership issues to your cap table on release.</p>}
            {esc.status === 'released' && <p className="text-sm font-semibold text-green-600">✓ Released — deal closed; ownership recorded on the cap table.</p>}
          </div>
        )}
      </div>
    </div>
  );
}

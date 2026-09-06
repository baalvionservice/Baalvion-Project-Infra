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
  // Which side of the table this viewer is on. The room is shared, so the same page has to
  // serve both — the company uploads and answers, the investor requests and proposes.
  const [side, setSide] = useState<'company' | 'investor' | 'other'>('other');

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
      // The API tells us our own org; whichever side of the deal it matches is our role here.
      const me = await fetch('/api/mp/whoami', { cache: 'no-store' }).then((r) => r.json()).catch(() => null);
      const myOrg = me?.data?.orgId;
      setSide(myOrg === d.json.data?.org_id_company ? 'company'
        : myOrg === d.json.data?.org_id_investor ? 'investor' : 'other');
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

  // The room is a conversation, so the transcript has to move on its own — otherwise the other
  // side's reply only appears if you happen to reload. Poll just the message list (cheap) while
  // Discussion is open, and pause when the tab is hidden so a backgrounded room costs nothing.
  useEffect(() => {
    if (state !== 'ready' || tab !== 'chat') return;
    let alive = true;
    const tick = async () => {
      if (document.hidden) return;
      try {
        const res = await call('/messages');
        if (alive && res.ok) setData((d: any) => ({ ...d, messages: res.json.data ?? d.messages }));
      } catch { /* transient — the next tick retries */ }
    };
    const id = setInterval(tick, 8000);
    return () => { alive = false; clearInterval(id); };
  }, [state, tab, call]);

  const [actionError, setActionError] = useState('');
  // Show the service's own reason. "Escrow is not configured on this environment" is the answer
  // the user needs; a silent no-op is how the old simulated buttons behaved.
  const act = async (label: string, fn: () => Promise<{ ok: boolean; json: any }>) => {
    setBusy(label); setActionError('');
    try {
      const res = await fn();
      if (res && !res.ok) setActionError(res.json?.error?.message || 'That action was refused.');
      else await load();
    } finally { setBusy(''); }
  };

  if (state === 'loading') return <Center><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></Center>;
  if (state === 'unauth') return <Center><div className="text-center"><Lock className="mx-auto h-10 w-10 text-gray-300" /><p className="mt-3 font-semibold">Sign in to open this deal room</p><Link href={`/invest/deals/${id}?login=1`} className="mt-4 inline-block rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white">Sign in</Link></div></Center>;
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
          {tab === 'chat' && (
            <Chat
              messages={data.messages}
              companyOrg={deal.org_id_company}
              investorOrg={deal.org_id_investor}
              onSend={(body: string) => act('msg', () => call('/messages', 'POST', { body }))}
              busy={busy === 'msg'}
            />
          )}

          {tab === 'dataroom' && (
            <DataRoom
              dealId={id} ndaSigned={ndaSigned} documents={data.documents} requests={data.docRequests} side={side}
              onUpload={(category: string, file: File) => act('up', async () => {
                // Multipart: the service needs the bytes to validate and scan them.
                const fd = new FormData();
                fd.append('file', file);
                fd.append('category', category);
                const res = await fetch(`/api/mp/deals/${id}/documents`, { method: 'POST', body: fd });
                return { ok: res.ok, json: await res.json().catch(() => ({})) };
              })}
              onFulfil={(rid: string) => act('ful' + rid, () => call(`/document-requests/${rid}`, 'PATCH', { status: 'uploaded' }))}
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
              signatures={data.signatures} escrow={data.escrow} terms={data.terms} side={side}
              onSign={() => act('sig', () => call('/signatures', 'POST', { document_type: 'spa', provider: 'docusign' }))}
              onInitiate={() => act('esc', () => call('/escrow', 'POST', {}))}
              busy={busy} error={actionError}
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

function Chat({ messages, companyOrg, investorOrg, onSend, busy }: any) {
  const [text, setText] = useState('');
  // The viewer of this page is the investor side; label by the sender's ORG rather than their
  // user id, which is meaningless to a reader. Messages written before sender_org_id existed
  // have no side to claim, so they say so instead of guessing.
  const sideOf = (m: any) => {
    if (m.sender_org_id && m.sender_org_id === investorOrg) return { label: 'You', mine: true };
    if (m.sender_org_id && m.sender_org_id === companyOrg) return { label: 'Company', mine: false };
    return { label: 'Unattributed', mine: false };
  };
  return (
    <div>
      <div className="max-h-[420px] space-y-3 overflow-y-auto rounded-2xl border border-gray-200 bg-gray-50 p-5">
        {messages.length === 0 && <p className="text-center text-sm text-gray-400">No messages yet. Start the conversation.</p>}
        {messages.map((m: any) => {
          const side = sideOf(m);
          return (
            <div key={m.id} className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${m.kind === 'system' ? 'mx-auto bg-gray-200 text-gray-600' : side.mine ? 'ml-auto bg-primary text-white' : 'bg-white border border-gray-200'}`}>
              {m.kind !== 'system' && <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider opacity-60">{side.label}</p>}
              {m.body}
            </div>
          );
        })}
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

function DataRoom({ dealId, ndaSigned, documents, requests, side, onSignNda, onRequest, onUpload, onFulfil, busy }: any) {
  const [cat, setCat] = useState('financial'); const [title, setTitle] = useState('');
  const [upCat, setUpCat] = useState('financial'); const [upFile, setUpFile] = useState<File | null>(null);
  const locked = documents === null;
  const isCompany = side === 'company';

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-gray-200 p-6">
        <h3 className="flex items-center gap-2 font-semibold">
          {locked ? <Lock className="h-4 w-4 text-amber-500" /> : <ShieldCheck className="h-4 w-4 text-green-600" />}
          Data Room {locked ? '— Locked' : '— Unlocked'}
        </h3>

        {/* The company owns this room, so it is never locked to them and the NDA prompt is not theirs. */}
        {locked && !isCompany && (
          <>
            <p className="mt-2 text-sm text-gray-600">Sign the mutual NDA to unlock the company&apos;s confidential documents.</p>
            <button disabled={busy === 'nda'} onClick={onSignNda} className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
              {busy === 'nda' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSignature className="h-4 w-4" />} Sign NDA &amp; unlock
            </button>
          </>
        )}

        {!locked && (
          <ul className="mt-4 space-y-2">
            {documents.length === 0 && <p className="text-sm text-gray-400">{isCompany ? 'You have not shared any documents yet.' : 'No documents shared yet. Request what you need →'}</p>}
            {documents.map((d: any) => (
              <li key={d.id} className="flex items-center gap-2 rounded-lg border border-gray-100 px-3 py-2 text-sm">
                <FileText className="h-4 w-4 shrink-0 text-gray-400" />
                <span className="truncate">{d.filename || String(d.file_url).split('/').pop()}</span>
                {d.category && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] capitalize text-gray-500">{d.category}</span>}
                {d.size_bytes ? <span className="text-[11px] text-gray-400">{Math.max(1, Math.round(Number(d.size_bytes) / 1024))} KB</span> : null}
                {/* Downloads are brokered by the service, re-authorised and audited on every read. */}
                {d.storage_key ? (
                  <a href={`/api/mp/deals/${dealId}/documents/${d.id}/download`} className="ml-auto shrink-0 text-xs font-semibold text-primary hover:underline">Download</a>
                ) : (
                  <span className="ml-auto text-xs text-gray-400">v{d.version}</span>
                )}
              </li>
            ))}
          </ul>
        )}
        {ndaSigned && !isCompany && <p className="mt-3 text-xs text-green-600">✓ NDA signed</p>}

        {/* Upload is company-side only — the service refuses it from the other side. */}
        {isCompany && (
          <form className="mt-5 space-y-3 border-t border-gray-100 pt-5" onSubmit={(e) => { e.preventDefault(); if (upFile) { onUpload(upCat, upFile); setUpFile(null); } }}>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Share a document</p>
            <select value={upCat} onChange={(e) => setUpCat(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              {['financial', 'legal', 'operational', 'compliance', 'tax'].map((c) => <option key={c} value={c}>{c[0].toUpperCase() + c.slice(1)}</option>)}
            </select>
            <input type="file" onChange={(e) => setUpFile(e.target.files?.[0] ?? null)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-gray-100 file:px-3 file:py-1 file:text-xs file:font-semibold" />
            <button disabled={busy === 'up' || !upFile} className="inline-flex items-center gap-1.5 rounded-full bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {busy === 'up' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Share
            </button>
            <p className="text-[11px] text-gray-400">Checked for content type and scanned before it is stored. The other side is notified.</p>
          </form>
        )}
      </div>

      <div className="rounded-2xl border border-gray-200 p-6">
        <h3 className="font-semibold">{isCompany ? 'What the investor has asked for' : 'Request documents'}</h3>
        {!isCompany && (
          <>
            <p className="mt-1 text-xs text-gray-500">Ask the company for specific diligence materials.</p>
            <form className="mt-4 space-y-3" onSubmit={(e) => { e.preventDefault(); if (title.trim()) { onRequest(cat, title.trim()); setTitle(''); } }}>
              <select value={cat} onChange={(e) => setCat(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                {['financial', 'legal', 'operational', 'compliance', 'tax'].map((c) => <option key={c} value={c}>{c[0].toUpperCase() + c.slice(1)}</option>)}
              </select>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Audited FY25 financials" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              <button disabled={busy === 'req'} className="inline-flex items-center gap-1.5 rounded-full bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                {busy === 'req' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Request
              </button>
            </form>
          </>
        )}
        <ul className="mt-4 space-y-2">
          {requests.length === 0 && <p className="text-sm text-gray-400">Nothing requested yet.</p>}
          {requests.map((r: any) => (
            <li key={r.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 px-3 py-2 text-sm">
              <span className="truncate">{r.title}</span>
              <div className="flex shrink-0 items-center gap-2">
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs capitalize text-gray-600">{r.status}</span>
                {/* Only the company can answer a request; only the requester signs it off. */}
                {isCompany && r.status === 'requested' && (
                  <button disabled={busy === 'ful' + r.id} onClick={() => onFulfil(r.id)} className="rounded-full border border-gray-300 px-3 py-1 text-xs font-semibold hover:border-primary hover:text-primary">
                    Mark provided
                  </button>
                )}
              </div>
            </li>
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

function Escrow({ signatures, escrow, terms, side, onSign, onInitiate, busy, error }: any) {
  const spa = signatures.find((s: any) => s.document_type === 'spa');
  const esc = escrow[0];
  const accepted = (terms ?? []).some((t: any) => t.status === 'accepted');

  return (
    <div className="space-y-6">
      {error && <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</p>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 p-6">
          <h3 className="flex items-center gap-2 font-semibold"><FileSignature className="h-4 w-4 text-primary" /> Sign the SPA</h3>
          {!accepted ? (
            <p className="mt-3 text-sm text-gray-500">Available once a term sheet is accepted.</p>
          ) : !spa ? (
            <>
              <button disabled={busy === 'sig'} onClick={onSign} className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                {busy === 'sig' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSignature className="h-4 w-4" />} Start e-signature
              </button>
              <p className="mt-3 text-xs text-gray-500">Opens an envelope with the e-signature provider. Both sides sign there.</p>
            </>
          ) : spa.status === 'signed' ? (
            <div className="mt-3 space-y-2">
              <p className="text-sm font-semibold text-green-600">✓ SPA signed</p>
              {spa.audit_url && <p className="text-xs text-gray-500 break-all">Audit trail: {spa.audit_url}</p>}
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              <p className="text-sm text-amber-600">⏳ Sent for signature — envelope {spa.envelope_id}</p>
              {/* No "mark it signed" button. The provider tells us when it is signed; a party
                  asserting that about its own counterparty is not a signature. */}
              <p className="text-xs text-gray-500">This updates automatically when the provider confirms all parties have signed.</p>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 p-6">
          <h3 className="flex items-center gap-2 font-semibold"><Landmark className="h-4 w-4 text-primary" /> Escrow funding</h3>
          {!esc ? (
            side === 'investor' ? (
              <>
                <button disabled={busy === 'esc' || !accepted} onClick={() => onInitiate(undefined)} className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                  {busy === 'esc' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Landmark className="h-4 w-4" />} Open escrow
                </button>
                <p className="mt-3 text-xs text-gray-500">{accepted ? 'Opens an account with the escrow provider at the agreed amount.' : 'Available once a term sheet is accepted.'}</p>
              </>
            ) : (
              <p className="mt-3 text-sm text-gray-500">The investor opens escrow once terms are accepted.</p>
            )
          ) : (
            <div className="mt-3 space-y-3">
              <p className="text-sm">Amount: <b>{money(esc.amount)}</b> · <span className="capitalize">{esc.status}</span></p>
              <p className="text-xs text-gray-500 break-all">Provider reference: {esc.escrow_ref}</p>
              {esc.status === 'initiated' && (
                // Funding is not a button. The provider reports the money arriving.
                <p className="text-sm text-amber-600">⏳ Awaiting funds. This moves to funded when the escrow provider confirms the transfer.</p>
              )}
              {esc.status === 'funded' && <p className="text-sm text-amber-600">⏳ Funded — awaiting compliance release. Ownership issues to the cap table on release.</p>}
              {esc.status === 'released' && <p className="text-sm font-semibold text-green-600">✓ Released — deal closed; ownership recorded on the cap table.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

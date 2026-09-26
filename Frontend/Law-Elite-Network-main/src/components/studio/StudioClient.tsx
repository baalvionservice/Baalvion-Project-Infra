"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Copy, FilePlus2, Link2, Loader2, Search, Send, XCircle } from 'lucide-react';
import { getToken } from '@/lib/api/client';
import { insertLink, markdownToHtml } from '@/lib/editorial/markdown';
import type { Analysis, LinkSuggestion } from '@/lib/editorial/analyze';
import type { PersonBrief } from '@/lib/editorial/brief';
import { useDrafts, type Draft } from './useDrafts';

type Tab = 'links' | 'tags' | 'checks' | 'brief';
interface PickerPerson { slug: string; name: string; category: string; thin: boolean }

async function studioFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { ...init, headers: { ...(init?.headers || {}), Authorization: `Bearer ${getToken() || ''}` } });
  if (!res.ok) {
    // Save/review endpoints explain themselves (permission, validation); pass that through.
    const detail = await res.json().then((j) => j?.error as string | undefined).catch(() => undefined);
    throw new Error(detail || (res.status === 401 || res.status === 403 ? 'Your session cannot use the Studio. Sign in again as an editor.' : 'The suggestion service is unavailable.'));
  }
  return res.json();
}

const AUTHOR_KEY = 'len-studio-author';
const sigOf = (d: Pick<Draft, 'title' | 'excerpt' | 'body' | 'categoryId' | 'author'>) => JSON.stringify([d.title, d.excerpt, d.body, d.categoryId ?? '', d.author ?? '']);

const LEVEL_ICON = {
  ok: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-label="Passed" />,
  warn: <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" aria-label="Warning" />,
  error: <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" aria-label="Problem" />,
};

export function StudioClient() {
  const { drafts, active, setActiveId, update, create, remove } = useDrafts();
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const [tab, setTab] = useState<Tab>('links');
  const [analysis, setAnalysis] = useState<{ result: Analysis; forBody: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState('');
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [cms, setCms] = useState<{ busy: boolean; message: string; error: boolean }>({ busy: false, message: '', error: false });

  useEffect(() => {
    studioFetch<{ categories: { id: string; name: string }[] }>('/api/studio/categories').then((d) => setCategories(d.categories)).catch(() => {});
  }, []);

  // The byline is remembered per editor so it is typed once.
  useEffect(() => {
    if (!active || active.author) return;
    let saved = '';
    try { saved = localStorage.getItem(AUTHOR_KEY) || ''; } catch { /* storage unavailable */ }
    update({ author: saved || 'Law Elite Editorial Team' });
  }, [active?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const title = active?.title ?? '';
  const excerpt = active?.excerpt ?? '';
  const body = active?.body ?? '';

  // Analyse a moment after typing stops. A newer request supersedes an older one.
  const seq = useRef(0);
  useEffect(() => {
    if (!active) return;
    const mine = ++seq.current;
    const t = setTimeout(async () => {
      setBusy(true);
      try {
        const result = await studioFetch<Analysis>('/api/studio/analyze', { method: 'POST', body: JSON.stringify({ title, excerpt, body }) });
        if (mine === seq.current) { setAnalysis({ result, forBody: body }); setError(null); }
      } catch (e) {
        if (mine === seq.current) setError((e as Error).message);
      } finally {
        if (mine === seq.current) setBusy(false);
      }
    }, 700);
    return () => clearTimeout(t);
  }, [active?.id, title, excerpt, body]); // eslint-disable-line react-hooks/exhaustive-deps

  // Suggestions carry offsets into the text they were computed from; only offer them while the text still matches.
  const fresh = analysis?.forBody === body;
  const result = analysis?.result;

  const applyLinks = (list: LinkSuggestion[]) => {
    if (!fresh) return;
    // Right-to-left so earlier offsets stay valid.
    const next = [...list].filter((l) => l.index >= 0).sort((a, b) => b.index - a.index).reduce((text, l) => insertLink(text, l.index, l.length, l.href), body);
    update({ body: next });
  };

  const addSeeAlso = (s: LinkSuggestion) => {
    const line = `[${s.label}](${s.href})`;
    const marker = /\n\nRelated reading: (.*)$/;
    update({ body: marker.test(body) ? body.replace(marker, (_m, rest) => `\n\nRelated reading: ${rest} · ${line}`) : `${body.trimEnd()}\n\nRelated reading: ${line}` });
  };

  const jumpTo = (s: LinkSuggestion) => {
    const el = bodyRef.current;
    if (!el || s.index < 0) return;
    el.focus();
    el.setSelectionRange(s.index, s.index + s.length);
  };

  const copy = async (what: string, text: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(what); setTimeout(() => setCopied(''), 1800); } catch { setCopied('Copy failed'); }
  };

  const unsaved = !!active && sigOf(active) !== active.savedSig;

  const saveToCms = async () => {
    if (!active) return;
    setCms({ busy: true, message: '', error: false });
    try {
      const r = await studioFetch<{ id: string; slug: string; status: string; created: boolean }>('/api/studio/save', {
        method: 'POST',
        body: JSON.stringify({ cmsId: active.cmsId, title, excerpt, body, categoryId: active.categoryId, author: active.author }),
      });
      try { if (active.author) localStorage.setItem(AUTHOR_KEY, active.author); } catch { /* storage unavailable */ }
      update({ cmsId: r.id, cmsSlug: r.slug, cmsState: active.cmsState === 'pending_review' ? 'pending_review' : 'draft', savedSig: sigOf(active) });
      setCms({ busy: false, message: r.created ? `Saved to the CMS as a draft: /${r.slug}. Nothing is published.` : 'Draft updated in the CMS. Nothing is published.', error: false });
    } catch (e) {
      setCms({ busy: false, message: (e as Error).message, error: true });
    }
  };

  const sendForReview = async () => {
    if (!active?.cmsId) return;
    setCms({ busy: true, message: '', error: false });
    try {
      await studioFetch('/api/studio/review', { method: 'POST', body: JSON.stringify({ cmsId: active.cmsId }) });
      update({ cmsState: 'pending_review' });
      setCms({ busy: false, message: 'Sent for review. An editor will approve and publish it in the CMS.', error: false });
    } catch (e) {
      setCms({ busy: false, message: (e as Error).message, error: true });
    }
  };

  const hasErrors = !!result?.checks.some((c) => c.level === 'error');

  const entityLinks = useMemo(() => (result?.links ?? []).filter((l) => l.type === 'entity' && l.index >= 0), [result]);
  const problems = result?.checks.filter((c) => c.level !== 'ok').length ?? 0;

  if (!active) return null;

  return (
    <main className="min-h-screen bg-slate-50 pt-[76px] lg:pt-[112px] pb-10">
      <div className="mx-auto max-w-[1500px] px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)_400px] gap-6">

        {/* ── Drafts ── */}
        <aside className="lg:sticky lg:top-[120px] lg:self-start space-y-3" aria-label="Drafts">
          <button type="button" onClick={() => create()} className="w-full inline-flex items-center justify-center gap-2 h-10 bg-[#0F2440] text-white text-[12px] font-bold uppercase tracking-wider hover:bg-[#16325a]">
            <FilePlus2 className="w-4 h-4" aria-hidden="true" /> New draft
          </button>
          <ul className="space-y-1 max-h-[40vh] lg:max-h-[70vh] overflow-y-auto">
            {drafts.map((d) => (
              <li key={d.id}>
                <div className={`group flex items-center justify-between gap-2 px-3 py-2 text-[13px] border ${d.id === active.id ? 'bg-white border-slate-900' : 'border-transparent hover:bg-white'}`}>
                  <button type="button" className="text-left flex-1 min-w-0 truncate font-semibold text-slate-800" onClick={() => setActiveId(d.id)}>
                    {d.title || 'Untitled draft'}
                  </button>
                  <button type="button" aria-label={`Remove draft ${d.title || 'untitled'}`} className="text-slate-300 hover:text-red-600 text-xs" onClick={() => { if (!d.body.trim() || window.confirm('Remove this draft from this browser?')) remove(d.id); }}>✕</button>
                </div>
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-slate-400 leading-snug">Drafts are kept in this browser only. Copy the finished article into the CMS.</p>
        </aside>

        {/* ── Editor ── */}
        <section className="space-y-4 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="font-headline text-2xl font-extrabold text-[#0F2440]">Article Studio</h1>
            <p className="text-[13px] text-slate-500" aria-live="polite">
              {result ? `${result.words} words · ${result.readingMinutes} min read` : ''}
              {busy && <Loader2 className="inline w-3.5 h-3.5 ml-2 animate-spin" aria-label="Analysing" />}
            </p>
          </div>
          {error && <div role="alert" className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

          <label className="block">
            <span className="sr-only">Title</span>
            <input value={title} onChange={(e) => update({ title: e.target.value })} placeholder="Headline" className="w-full h-14 px-4 bg-white border border-slate-300 font-headline text-2xl font-extrabold text-slate-900 focus:outline-none focus:border-slate-900" />
          </label>
          <label className="block">
            <span className="sr-only">Summary</span>
            <textarea value={excerpt} onChange={(e) => update({ excerpt: e.target.value })} rows={2} placeholder="Summary for search results (80–160 characters)" className="w-full px-4 py-3 bg-white border border-slate-300 text-[15px] text-slate-700 focus:outline-none focus:border-slate-900" />
          </label>
          <label className="block">
            <span className="sr-only">Article body</span>
            <textarea ref={bodyRef} value={body} onChange={(e) => update({ body: e.target.value })} rows={26} placeholder={'Write here. Blank line = new paragraph. ## Heading, - list item, **bold**, [text](link).\n\nName people, cases, courts and topics in full and they are connected automatically.'} className="w-full px-4 py-3 bg-white border border-slate-300 font-serif text-[16px] leading-relaxed text-slate-800 focus:outline-none focus:border-slate-900" />
          </label>

          <div className="bg-white border border-slate-200 p-4 space-y-3" aria-label="Save to CMS">
            <div className="flex flex-wrap items-end gap-3">
              <label className="block">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Category</span>
                <select value={active.categoryId ?? ''} onChange={(e) => update({ categoryId: e.target.value || undefined })} className="h-10 min-w-56 border border-slate-300 bg-white px-3 text-sm">
                  <option value="">{categories.length ? 'Choose…' : 'Loading…'}</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Byline</span>
                <input value={active.author ?? ''} onChange={(e) => update({ author: e.target.value })} className="h-10 w-64 border border-slate-300 px-3 text-sm" maxLength={120} />
              </label>
              <button type="button" onClick={saveToCms} disabled={cms.busy || !title.trim() || !body.trim()} className="inline-flex items-center gap-2 h-10 px-5 bg-[#0F2440] text-white text-[12px] font-bold uppercase tracking-wider hover:bg-[#16325a] disabled:opacity-40">
                {cms.busy ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : null}{active.cmsId ? 'Update draft in CMS' : 'Save to CMS'}
              </button>
              <button type="button" onClick={sendForReview} disabled={cms.busy || !active.cmsId || unsaved || hasErrors || active.cmsState === 'pending_review'} title={hasErrors ? 'Fix the problems in Checks first' : unsaved ? 'Save your latest changes first' : undefined} className="inline-flex items-center gap-2 h-10 px-5 border border-slate-900 text-[12px] font-bold uppercase tracking-wider hover:bg-slate-900 hover:text-white disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-900">
                <Send className="w-4 h-4" aria-hidden="true" /> {active.cmsState === 'pending_review' ? 'In review' : 'Send for review'}
              </button>
            </div>
            <p className={`text-[13px] ${cms.error ? 'text-red-700' : 'text-emerald-700'}`} role={cms.error ? 'alert' : 'status'}>{cms.message}</p>
            {active.cmsId && !cms.message && (
              <p className="text-[12px] text-slate-500">
                {active.cmsState === 'pending_review' ? 'In the review queue' : 'Saved as a draft'} in the CMS: /{active.cmsSlug}. {unsaved ? 'You have changes that are not saved yet.' : 'Up to date.'}
              </p>
            )}
            <p className="text-[11px] text-slate-400 leading-snug">The Studio only saves drafts and sends them for review. Approving and publishing happen in the CMS. Your CMS permissions apply.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => copy('HTML copied', markdownToHtml(body))} className="inline-flex items-center gap-2 h-10 px-4 bg-[#E13131] text-white text-[12px] font-bold uppercase tracking-wider hover:bg-red-700"><Copy className="w-4 h-4" aria-hidden="true" /> Copy HTML for CMS</button>
            <button type="button" onClick={() => copy('Markdown copied', body)} className="h-10 px-4 border border-slate-300 bg-white text-[12px] font-bold uppercase tracking-wider hover:border-slate-900">Copy Markdown</button>
            {result && <button type="button" onClick={() => copy('Tags copied', result.entities.map((e) => `${e.kind}: ${e.label}`).join('\n'))} className="h-10 px-4 border border-slate-300 bg-white text-[12px] font-bold uppercase tracking-wider hover:border-slate-900">Copy tag list</button>}
            <span className="text-[12px] text-emerald-700" role="status">{copied}</span>
          </div>
        </section>

        {/* ── Suggestions ── */}
        <aside className="lg:sticky lg:top-[120px] lg:self-start bg-white border border-slate-200" aria-label="Suggestions">
          <div role="tablist" className="grid grid-cols-4 border-b border-slate-200 text-[12px] font-bold uppercase tracking-wide">
            {([['links', 'Links', entityLinks.length + (result?.links.filter((l) => l.type === 'article').length ?? 0)], ['tags', 'Tags', result?.entities.length ?? 0], ['checks', 'Checks', problems], ['brief', 'Person', 0]] as [Tab, string, number][]).map(([id, label, n]) => (
              <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`py-3 ${tab === id ? 'bg-[#0F2440] text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
                {label}{n > 0 && <span className="ml-1 text-[10px] opacity-70">{n}</span>}
              </button>
            ))}
          </div>

          <div className="p-4 max-h-[70vh] overflow-y-auto">
            {!result && !error && <p className="text-sm text-slate-500">Start writing. Suggestions appear as you pause.</p>}

            {tab === 'links' && result && (
              <div className="space-y-4">
                {entityLinks.length > 1 && (
                  <button type="button" disabled={!fresh} onClick={() => applyLinks(entityLinks)} className="w-full h-9 border border-slate-900 text-[12px] font-bold uppercase tracking-wider hover:bg-slate-900 hover:text-white disabled:opacity-40">
                    Link all {entityLinks.length} names
                  </button>
                )}
                {result.links.length === 0 && <p className="text-sm text-slate-500">Nothing to link yet. Name people, cases, courts or topics in full, or mention a subject we have covered.</p>}
                <ul className="space-y-3">
                  {result.links.map((s) => (
                    <li key={s.id} className="border border-slate-200 p-3">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{s.type === 'entity' ? 'Profile / page' : 'Our article'}</p>
                      <p className="text-[14px] font-semibold text-slate-900 leading-snug">{s.label}</p>
                      <p className="text-[12px] text-slate-500 mt-0.5">{s.reason}</p>
                      <div className="mt-2 flex gap-2">
                        {s.index >= 0 ? (
                          <>
                            <button type="button" disabled={!fresh} onClick={() => applyLinks([s])} className="inline-flex items-center gap-1 h-8 px-3 bg-[#0F2440] text-white text-[11px] font-bold uppercase tracking-wider disabled:opacity-40"><Link2 className="w-3 h-3" aria-hidden="true" /> Link “{body.slice(s.index, s.index + s.length)}”</button>
                            <button type="button" onClick={() => jumpTo(s)} className="h-8 px-3 border border-slate-300 text-[11px] font-bold uppercase tracking-wider hover:border-slate-900">Show</button>
                          </>
                        ) : (
                          <button type="button" onClick={() => addSeeAlso(s)} className="h-8 px-3 bg-[#0F2440] text-white text-[11px] font-bold uppercase tracking-wider">Add to “Related reading”</button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
                {!fresh && <p className="text-[12px] text-slate-400">Updating suggestions…</p>}
              </div>
            )}

            {tab === 'tags' && result && (
              <div className="space-y-5">
                <div>
                  <p className="text-[12px] text-slate-500 mb-2">These are connected to the article automatically when it is published. No manual tagging needed.</p>
                  {result.entities.length === 0 ? <p className="text-sm text-slate-500">No known people, cases, courts or topics named yet.</p> : (
                    <ul className="space-y-1.5">
                      {result.entities.map((e) => (
                        <li key={e.key} className="flex items-center justify-between gap-2 text-[13px]">
                          <span><span className="font-semibold text-slate-900">{e.label}</span> <span className="text-slate-400">{e.kind} · {e.count}×</span></span>
                          <span className={e.linked ? 'text-emerald-600 text-[11px] font-bold' : 'text-amber-600 text-[11px] font-bold'}>{e.linked ? 'Linked' : 'Not linked'}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {result.related.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">You could also mention</p>
                    <ul className="space-y-1.5">
                      {result.related.map((r) => (
                        <li key={r.key} className="text-[13px]"><Link href={r.url} target="_blank" className="font-semibold text-slate-900 hover:text-news-600">{r.label}</Link> <span className="text-slate-400">{r.kind}. {r.why}</span></li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {tab === 'checks' && result && (
              <ul className="space-y-2.5">
                {result.checks.map((c) => (
                  <li key={c.id} className="flex gap-2 text-[13px] text-slate-700">{LEVEL_ICON[c.level]}<span>{c.message}</span></li>
                ))}
              </ul>
            )}

            {tab === 'brief' && (
              <PersonBrief
                onStart={(brief) => {
                  const intro = `[${brief.name}](${brief.url}) `;
                  const sections = brief.outline.map((h) => `## ${h}\n\n`).join('');
                  create({ title: `${brief.name}: `, body: `${intro}\n\n${sections}`.trimEnd() + '\n' });
                  setTab('links');
                }}
                onInsert={(line) => update({ body: `${body.trimEnd()}${body.trim() ? '\n' : ''}- ${line}\n` })}
              />
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}

function PersonBrief({ onStart, onInsert }: { onStart: (b: PersonBrief) => void; onInsert: (fact: string) => void }) {
  const [people, setPeople] = useState<PickerPerson[] | null>(null);
  const [q, setQ] = useState('');
  const [brief, setBrief] = useState<PersonBrief | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    studioFetch<{ people: PickerPerson[] }>('/api/studio/people').then((d) => setPeople(d.people)).catch((e) => setErr((e as Error).message));
  }, []);

  const matches = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!people || needle.length < 2) return [];
    return people.filter((p) => p.name.toLowerCase().includes(needle)).slice(0, 8);
  }, [people, q]);

  const load = useCallback(async (slug: string) => {
    setErr(null);
    try { setBrief(await studioFetch<PersonBrief>(`/api/studio/brief?slug=${encodeURIComponent(slug)}`)); setQ(''); } catch (e) { setErr((e as Error).message); }
  }, []);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={people ? `Find one of ${people.length} people…` : 'Loading people…'} aria-label="Find a person" className="w-full h-10 pl-9 pr-3 border border-slate-300 text-sm focus:outline-none focus:border-slate-900" />
      </div>
      {err && <p className="text-sm text-red-600">{err}</p>}
      {matches.length > 0 && (
        <ul className="border border-slate-200 divide-y divide-slate-100">
          {matches.map((p) => (
            <li key={p.slug}><button type="button" onClick={() => load(p.slug)} className="w-full text-left px-3 py-2 text-[13px] hover:bg-slate-50">{p.name} <span className="text-slate-400">{p.category}{p.thin ? ' · stub' : ''}</span></button></li>
          ))}
        </ul>
      )}

      {brief && (
        <div className="space-y-4">
          <div>
            <p className="font-headline text-lg font-extrabold text-slate-900">{brief.name}</p>
            <p className="text-[12px] text-slate-500">{brief.category} · <Link href={brief.url} target="_blank" className="underline">profile</Link></p>
          </div>
          {(!brief.depth.hasBio || !brief.depth.hasSources) && (
            <p className="text-[12px] border border-amber-200 bg-amber-50 text-amber-800 px-3 py-2">This profile is thin ({[!brief.depth.hasBio && 'no full biography', !brief.depth.hasSources && 'no sources', !brief.depth.hasPhoto && 'no photo'].filter(Boolean).join(', ')}). Facts below may be sparse. Check them before you rely on them.</p>
          )}
          <button type="button" onClick={() => onStart(brief)} className="w-full h-9 bg-[#0F2440] text-white text-[12px] font-bold uppercase tracking-wider">Start an article on {brief.name}</button>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Facts on file ({brief.facts.length})</p>
            {brief.facts.length === 0 ? <p className="text-sm text-slate-500">Nothing on file beyond the name.</p> : (
              <ul className="space-y-1.5">
                {brief.facts.map((f, i) => (
                  <li key={i} className="flex items-start justify-between gap-2 text-[13px] text-slate-700"><span>{f}</span><button type="button" onClick={() => onInsert(f)} className="shrink-0 text-[11px] font-bold uppercase text-blue-700 hover:underline">Insert</button></li>
                ))}
              </ul>
            )}
            <p className="text-[11px] text-slate-400 mt-2">Facts are prompts, not copy: put them in your own words.</p>
          </div>

          {brief.articles.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Already written about them</p>
              <ul className="space-y-1">{brief.articles.map((a) => <li key={a.url} className="text-[13px]"><Link href={a.url} target="_blank" className="text-slate-800 hover:text-news-600">{a.title}</Link></li>)}</ul>
            </div>
          )}
          {brief.related.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Connected on the site</p>
              <ul className="space-y-1">{brief.related.map((r) => <li key={r.url} className="text-[13px]"><Link href={r.url} target="_blank" className="text-slate-800 hover:text-news-600">{r.label}</Link> <span className="text-slate-400">{r.kind}</span></li>)}</ul>
            </div>
          )}
          {brief.sources.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Sources for the facts</p>
              <ul className="space-y-1">{brief.sources.map((s) => <li key={s.url} className="text-[13px]"><a href={s.url} target="_blank" rel="noopener noreferrer nofollow" className="text-blue-700 hover:underline">{s.label}</a></li>)}</ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

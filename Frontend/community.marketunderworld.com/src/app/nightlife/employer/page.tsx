"use client"

import { useAuth } from "@/context/auth-context"
import { useCallback, useEffect, useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { SignInNotice, ReviewBanner } from "@/components/nightlife/sign-in-notice";
import { Search, Filter, MessageCircle, MapPin, Instagram, CheckCircle2, AlertCircle } from "lucide-react";
import { ALL_ZONES, CANDIDATE_ROLES, DRESS_CODES, PAY_CYCLES } from "@/data/nightlife-data";
import {
  gigs, people, isUnauthorized,
  type Employer, type Gig, type GigApplication, type GigApplicationStatus, type Profile,
} from "@/lib/api/gigs";
import { cn } from "@/lib/utils";

const inputCls = "w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 outline-none focus:border-blue-500/50";
const labelCls = "block text-xs font-bold text-gray-400 uppercase mb-2";

function EmployerForm({ initial, onSaved }: { initial: Employer | null; onSaved: (e: Employer) => void }) {
  const [form, setForm] = useState({
    businessName: initial?.businessName ?? "", contactName: initial?.contactName ?? "", phone: initial?.phone ?? "",
    city: initial?.city ?? "", website: initial?.website ?? "", instagram: initial?.instagram ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    setSaving(true);
    try {
      onSaved(await people.saveEmployer({
        businessName: form.businessName, contactName: form.contactName, phone: form.phone, city: form.city,
        website: form.website || undefined, instagram: form.instagram || undefined,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white/[0.02] border border-white/10 rounded-3xl p-8 space-y-6">
      <p className="text-sm text-gray-400">Tell us who you are. We verify every employer before they can post gigs or see candidates.</p>
      <div className="grid md:grid-cols-2 gap-6">
        <div><label className={labelCls}>Business / Venue Name</label><input className={inputCls} value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} /></div>
        <div><label className={labelCls}>Contact Person</label><input className={inputCls} value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} /></div>
        <div><label className={labelCls}>Phone</label><input type="tel" className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
        <div><label className={labelCls}>City</label><input className={inputCls} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
        <div><label className={labelCls}>Website (optional)</label><input type="url" className={inputCls} value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} /></div>
        <div><label className={labelCls}>Instagram (optional)</label><input className={inputCls} placeholder="@" value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} /></div>
      </div>
      {error && <p role="alert" className="text-red-400 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</p>}
      <button onClick={submit} disabled={saving} className="w-full h-14 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 rounded-xl font-bold text-lg transition-colors">
        {saving ? "Saving…" : initial ? "Update & Resubmit" : "Submit for Verification"}
      </button>
    </div>
  );
}

function CandidatesTab() {
  const [zone, setZone] = useState("All");
  const [search, setSearch] = useState("");
  const [list, setList] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    people.candidates({ zone: zone === "All" ? undefined : zone })
      .then(setList)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load candidates."))
      .finally(() => setLoading(false));
  }, [zone]);

  const filtered = list.filter((c) => {
    const s = search.toLowerCase();
    return !s || c.fullName.toLowerCase().includes(s) || c.roles.some((r) => r.toLowerCase().includes(s)) || c.services.some((r) => r.toLowerCase().includes(s));
  });

  const contact = async (c: Profile) => {
    // Open the window synchronously so popup blockers allow it, then point it at the number.
    const win = window.open("", "_blank");
    try {
      const { whatsapp } = await people.revealContact(c.id);
      const text = `Hi ${c.fullName.split(" ")[0]}, I found your profile on Market Underworld. Are you free for an upcoming gig?`;
      const target = `https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
      if (win) win.location.href = target;
      else window.location.href = target;
    } catch (err) {
      win?.close();
      setError(err instanceof Error ? err.message : "Could not get contact details.");
    }
  };

  return (
    <>
      <div className="flex flex-col md:flex-row gap-4 mb-8 bg-white/[0.02] p-4 rounded-2xl border border-white/10">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input type="text" placeholder="Search roles (e.g. Hostess, VIP Escort)..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full h-12 bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 outline-none focus:border-blue-500/50" />
        </div>
        <div className="w-full md:w-64 relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <select value={zone} onChange={(e) => setZone(e.target.value)} className="w-full h-12 bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 outline-none focus:border-blue-500/50 appearance-none">
            <option value="All">All Zones</option>
            {ALL_ZONES.map((z) => <option key={z} value={z}>{z}</option>)}
          </select>
        </div>
      </div>
      {error && <p role="alert" className="mb-4 text-red-400 text-sm">{error}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((c) => (
          <div key={c.id} className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden flex flex-col">
            <div className="h-48 bg-white/5 relative">
              {c.portraitUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.portraitUrl} alt={c.fullName} className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-5xl font-black text-white/20">{c.fullName.charAt(0)}</div>
              )}
              <div className="absolute top-3 right-3 bg-blue-500/90 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Verified
              </div>
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold">{c.fullName}</h3>
                <span className="text-gray-400 text-sm">{c.age} yrs{c.height ? ` • ${c.height}` : ""}</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-blue-400 mb-4"><MapPin className="w-4 h-4" /> {c.zone}</div>
              <div className="mb-4">
                <div className="text-xs text-gray-500 font-bold uppercase mb-1">Roles</div>
                <div className="flex flex-wrap gap-1.5">
                  {c.roles.slice(0, 3).map((r) => <span key={r} className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-gray-300">{r}</span>)}
                  {c.roles.length > 3 && <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-gray-300">+{c.roles.length - 3}</span>}
                </div>
              </div>
              <div className="mt-auto pt-4 flex gap-2">
                <a href={`https://instagram.com/${c.instagram}`} target="_blank" rel="noreferrer" className="flex-1 h-10 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center gap-2 text-sm font-bold transition-colors">
                  <Instagram className="w-4 h-4" /> Insta
                </a>
                <button onClick={() => contact(c)} className="flex-[2] h-10 bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] rounded-lg flex items-center justify-center gap-2 text-sm font-bold transition-colors">
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </button>
              </div>
            </div>
          </div>
        ))}
        {!loading && filtered.length === 0 && (
          <div className="col-span-full py-20 text-center text-gray-500">No verified candidates found matching your criteria.</div>
        )}
      </div>
    </>
  );
}

function PostGigForm({ onPosted }: { onPosted: () => void }) {
  const [form, setForm] = useState({ title: "", payAmount: "", payCycle: PAY_CYCLES[0], venueAddress: "", dressCode: "", eventDate: "", rolesNeeded: [] as string[] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const toggleRole = (r: string) =>
    setForm((p) => ({ ...p, rolesNeeded: p.rolesNeeded.includes(r) ? p.rolesNeeded.filter((x) => x !== r) : [...p.rolesNeeded, r] }));

  const submit = async () => {
    setError("");
    setSaving(true);
    try {
      await gigs.create({
        title: form.title, payAmount: Number(form.payAmount), payCycle: form.payCycle, venueAddress: form.venueAddress,
        dressCode: form.dressCode || undefined, eventDate: form.eventDate, rolesNeeded: form.rolesNeeded,
      });
      onPosted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not post the gig.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white/[0.02] border border-white/10 rounded-3xl p-8 space-y-6">
      <div><label className={labelCls}>Gig Title</label><input className={inputCls} placeholder="e.g. 8 Hostesses — Saturday Night, Juhu" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
      <div className="grid md:grid-cols-3 gap-6">
        <div><label className={labelCls}>Pay (₹ per person)</label><input type="number" min="0" className={inputCls} value={form.payAmount} onChange={(e) => setForm({ ...form, payAmount: e.target.value })} /></div>
        <div><label className={labelCls}>Pay Cycle</label>
          <select className={cn(inputCls, "appearance-none")} value={form.payCycle} onChange={(e) => setForm({ ...form, payCycle: e.target.value })}>{PAY_CYCLES.map((c) => <option key={c}>{c}</option>)}</select></div>
        <div><label className={labelCls}>Event Date</label><input type="date" className={inputCls} value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} /></div>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div><label className={labelCls}>Venue Address</label><input className={inputCls} value={form.venueAddress} onChange={(e) => setForm({ ...form, venueAddress: e.target.value })} /></div>
        <div><label className={labelCls}>Dress Code</label>
          <select className={cn(inputCls, "appearance-none")} value={form.dressCode} onChange={(e) => setForm({ ...form, dressCode: e.target.value })}><option value="">Not specified</option>{DRESS_CODES.map((c) => <option key={c}>{c}</option>)}</select></div>
      </div>
      <div>
        <label className={labelCls}>Roles Needed</label>
        <div className="flex flex-wrap gap-2">
          {CANDIDATE_ROLES.map((r) => (
            <button type="button" key={r} onClick={() => toggleRole(r)} className={cn("px-4 py-2 rounded-lg text-sm border transition-colors", form.rolesNeeded.includes(r) ? "bg-blue-600/20 border-blue-500 text-blue-300" : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10")}>{r}</button>
          ))}
        </div>
      </div>
      <p className="text-xs text-amber-400">Gigs that ask candidates for any upfront fee are removed and the employer is banned.</p>
      {error && <p role="alert" className="text-red-400 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</p>}
      <button onClick={submit} disabled={saving} className="w-full h-14 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 rounded-xl font-bold text-lg transition-colors">{saving ? "Posting…" : "Post Gig"}</button>
    </div>
  );
}

const APP_ACTIONS: { status: Exclude<GigApplicationStatus, "withdrawn" | "pending">; label: string }[] = [
  { status: "shortlisted", label: "Shortlist" },
  { status: "hired", label: "Hire" },
  { status: "rejected", label: "Reject" },
];

function MyGigsTab() {
  const [list, setList] = useState<Gig[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [apps, setApps] = useState<GigApplication[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(() => gigs.mine().then(setList).catch((e) => setError(e instanceof Error ? e.message : "Could not load gigs.")), []);
  useEffect(() => { load(); }, [load]);

  const toggle = async (id: string) => {
    if (open === id) return setOpen(null);
    setOpen(id);
    try { setApps(await gigs.applications(id)); } catch (e) { setError(e instanceof Error ? e.message : "Could not load applications."); }
  };

  const decide = async (appId: string, status: Exclude<GigApplicationStatus, "withdrawn">) => {
    try {
      await gigs.setApplicationStatus(appId, status);
      if (open) setApps(await gigs.applications(open));
    } catch (e) { setError(e instanceof Error ? e.message : "Could not update."); }
  };

  const setStatus = async (id: string, status: "active" | "filled" | "closed") => {
    try { await gigs.setStatus(id, status); await load(); } catch (e) { setError(e instanceof Error ? e.message : "Could not update."); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {error && <p role="alert" className="text-red-400 text-sm">{error}</p>}
      {list.length === 0 && <p className="text-center text-gray-500 py-16">You haven&apos;t posted any gigs yet.</p>}
      {list.map((g) => (
        <div key={g.id} className="rounded-2xl bg-white/[0.02] border border-white/10 overflow-hidden">
          <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="font-bold text-lg">{g.title}</div>
              <div className="text-sm text-gray-400">{g.eventDate} · ₹{g.payAmount.toLocaleString("en-IN")} · <span className="uppercase text-xs font-bold text-blue-300">{g.status}</span> · {g.applicationCount ?? 0} applicant(s)</div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => toggle(g.id)} className="h-10 px-4 rounded-lg bg-white/5 hover:bg-white/10 text-sm font-bold">{open === g.id ? "Hide" : "Applicants"}</button>
              {g.status === "active" && <button onClick={() => setStatus(g.id, "filled")} className="h-10 px-4 rounded-lg bg-green-500/10 text-green-400 text-sm font-bold">Mark filled</button>}
              {g.status === "active" && <button onClick={() => setStatus(g.id, "closed")} className="h-10 px-4 rounded-lg bg-white/5 text-gray-300 text-sm font-bold">Close</button>}
              {g.status !== "active" && <button onClick={() => setStatus(g.id, "active")} className="h-10 px-4 rounded-lg bg-white/5 text-gray-300 text-sm font-bold">Reopen</button>}
            </div>
          </div>
          {open === g.id && (
            <div className="border-t border-white/5 p-5 space-y-3">
              {apps.length === 0 && <p className="text-sm text-gray-500">No applicants yet.</p>}
              {apps.map((a) => (
                <div key={a.id} className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-xl bg-white/[0.02]">
                  <div>
                    <div className="font-bold">{a.profile?.fullName} <span className="text-xs text-gray-500 font-normal">{a.profile?.age} yrs · {a.profile?.zone}</span></div>
                    <div className="text-xs text-gray-500">{a.profile?.roles.join(", ")}{a.note ? ` — “${a.note}”` : ""}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase text-fuchsia-300 mr-2">{a.status}</span>
                    {a.status !== "withdrawn" && APP_ACTIONS.filter((x) => x.status !== a.status).map((x) => (
                      <button key={x.status} onClick={() => decide(a.id, x.status)} className="h-8 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold">{x.label}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function EmployerDashboard() {
  const [loading, setLoading] = useState(true);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [employer, setEmployer] = useState<Employer | null>(null);
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState<"candidates" | "gigs" | "post">("candidates");
  const [error, setError] = useState("");

  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setNeedsLogin(true);
      setLoading(false);
      return;
    }
    people.myEmployer()
      .then(setEmployer)
      .catch((err) => (isUnauthorized(err) ? setNeedsLogin(true) : setError(err instanceof Error ? err.message : "Could not load your account.")))
      .finally(() => setLoading(false));
  }, [authLoading, isAuthenticated]);

  const verified = employer?.status === "verified";

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      <Navbar />
      <main className="container max-w-6xl mx-auto px-6 pt-32 pb-24">
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black">Employer Dashboard</h1>
            <p className="text-gray-400 mt-2">Find and recruit verified nightlife staff.</p>
          </div>
          {verified && !editing && (
            <div className="flex bg-white/5 p-1 rounded-xl">
              {([["candidates", "Candidates"], ["gigs", "My Gigs"], ["post", "Post a Gig"]] as const).map(([k, label]) => (
                <button key={k} onClick={() => setTab(k)} className={cn("px-5 py-2.5 rounded-lg font-bold text-sm transition-colors", tab === k ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white")}>{label}</button>
              ))}
            </div>
          )}
        </div>

        {loading && <p className="text-center text-gray-500 py-20">Loading…</p>}
        {error && <p role="alert" className="text-red-400 text-sm mb-4">{error}</p>}
        {!loading && needsLogin && <SignInNotice next="/nightlife/employer" what="register as an employer" />}

        {!loading && !needsLogin && (!employer || editing) && (
          <EmployerForm initial={employer} onSaved={(e) => { setEmployer(e); setEditing(false); }} />
        )}

        {!loading && !needsLogin && employer && !editing && (
          <>
            <div className="max-w-4xl mx-auto"><ReviewBanner status={employer.status} note={employer.reviewNote} subject="employer account" /></div>
            {!verified && (
              <div className="text-center"><button onClick={() => setEditing(true)} className="text-sm text-blue-400 underline">Edit details</button></div>
            )}
            {verified && tab === "candidates" && <CandidatesTab />}
            {verified && tab === "gigs" && <MyGigsTab />}
            {verified && tab === "post" && <PostGigForm onPosted={() => setTab("gigs")} />}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

"use client"

import { useAuth } from "@/context/auth-context"
import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { SignInNotice, ReviewBanner } from "@/components/nightlife/sign-in-notice";
import { AlertCircle, Send, MapPin } from "lucide-react";
import { ALL_ZONES, CANDIDATE_ROLES, CANDIDATE_SERVICES, PERKS } from "@/data/nightlife-data";
import { gigs, people, isUnauthorized, type Gig, type GigApplication, type Profile } from "@/lib/api/gigs";
import { cn } from "@/lib/utils";
import { ImageUpload } from "@/components/upload/image-upload";

type ListField = "roles" | "services" | "perks";

const emptyForm = {
  fullName: "", gender: "", age: "", height: "", instagram: "", zone: "", whatsapp: "",
  portraitUrl: "", fullLookUrl: "",
  roles: [] as string[], services: [] as string[], perks: [] as string[],
};

const inputCls = "w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 outline-none focus:border-fuchsia-500/50";
const labelCls = "block text-xs font-bold text-gray-400 uppercase mb-2";

export default function CandidateDashboard() {
  const [activeTab, setActiveTab] = useState<"profile" | "gigs">("profile");
  const [loading, setLoading] = useState(true);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [board, setBoard] = useState<Gig[]>([]);
  const [applications, setApplications] = useState<GigApplication[]>([]);

  const fillForm = (p: Profile) =>
    setForm({
      fullName: p.fullName, gender: p.gender, age: String(p.age), height: p.height ?? "", instagram: p.instagram,
      zone: p.zone, whatsapp: p.whatsapp ?? "", portraitUrl: p.portraitUrl ?? "", fullLookUrl: p.fullLookUrl ?? "",
      roles: p.roles, services: p.services, perks: p.perks,
    });

  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setNeedsLogin(true);
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const [mine, open, apps] = await Promise.all([people.myProfile(), gigs.list(), gigs.myApplications()]);
        setProfile(mine);
        if (mine) fillForm(mine);
        setBoard(open);
        setApplications(apps);
      } catch (err) {
        if (isUnauthorized(err)) setNeedsLogin(true);
        else setError(err instanceof Error ? err.message : "Could not load your dashboard.");
      } finally {
        setLoading(false);
      }
    })();
  }, [authLoading, isAuthenticated]);

  const toggle = (field: ListField, item: string) =>
    setForm((prev) => ({ ...prev, [field]: prev[field].includes(item) ? prev[field].filter((i) => i !== item) : [...prev[field], item] }));

  const handleSubmit = async () => {
    setError("");
    if (!form.gender) return setError("Select a gender.");
    setSaving(true);
    try {
      const saved = await people.saveProfile({
        fullName: form.fullName, gender: form.gender as Profile["gender"], age: Number(form.age),
        height: form.height || undefined, instagram: form.instagram, zone: form.zone, whatsapp: form.whatsapp,
        roles: form.roles, services: form.services, perks: form.perks,
        portraitUrl: form.portraitUrl || undefined, fullLookUrl: form.fullLookUrl || undefined,
      });
      setProfile(saved);
      fillForm(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your profile.");
    } finally {
      setSaving(false);
    }
  };

  const withdraw = async (id: string) => {
    try {
      await gigs.withdraw(id);
      setApplications(await gigs.myApplications());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not withdraw.");
    }
  };

  const appliedGigIds = new Set(applications.filter((a) => a.status !== "withdrawn").map((a) => a.gigId));

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      <Navbar />

      <main className="container max-w-6xl mx-auto px-6 pt-32 pb-24">
        <div className="mb-8 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
          <p className="text-sm text-amber-400 font-bold uppercase tracking-wider flex items-center justify-center gap-2">
            <AlertCircle className="w-5 h-5" /> Warning: Never pay any coordinator an upfront registration fee or dress fee to get work. Report scam posts instantly.
          </p>
        </div>

        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl font-black">Candidate Dashboard</h1>
            <p className="text-gray-400 mt-2">Manage your profile and find gigs.</p>
          </div>
          <div className="flex bg-white/5 p-1 rounded-xl">
            {(["profile", "gigs"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn("px-6 py-2.5 rounded-lg font-bold text-sm transition-colors", activeTab === tab ? "bg-fuchsia-600 text-white" : "text-gray-400 hover:text-white")}
              >
                {tab === "profile" ? "My Profile" : "Available Gigs"}
              </button>
            ))}
          </div>
        </div>

        {loading && <p className="text-center text-gray-500 py-20">Loading…</p>}
        {!loading && needsLogin && <SignInNotice next="/nightlife/candidate" what="create a candidate profile and apply for gigs" />}

        {!loading && !needsLogin && activeTab === "profile" && (
          <div className="max-w-3xl mx-auto">
            {profile && <ReviewBanner status={profile.status} note={profile.reviewNote} subject="profile" />}
            <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-8 space-y-8">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className={labelCls}>Full Name</label>
                  <input type="text" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Gender</label>
                  <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className={cn(inputCls, "appearance-none")}>
                    <option value="">Select</option>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Non-binary">Non-binary</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Age (Must be 21+)</label>
                  <input type="number" min="21" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Height (e.g. 5&apos;6&quot;)</label>
                  <input type="text" value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Instagram Handle</label>
                  <input type="text" placeholder="@" value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Primary Zone</label>
                  <select value={form.zone} onChange={(e) => setForm({ ...form, zone: e.target.value })} className={cn(inputCls, "appearance-none")}>
                    <option value="">Select Zone</option>
                    {ALL_ZONES.map((z) => <option key={z} value={z}>{z}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className={labelCls}>WhatsApp Number</label>
                  <input type="tel" placeholder="+91..." value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} className={inputCls} />
                  <p className="text-xs text-gray-500 mt-1">Never shown publicly. Shared one-to-one with verified employers who contact you.</p>
                </div>
              </div>

              <div className="space-y-6">
                {([
                  ["roles", "Roles You Offer", CANDIDATE_ROLES, "bg-fuchsia-600/20 border-fuchsia-500 text-fuchsia-300"],
                  ["services", "Services You Provide", CANDIDATE_SERVICES, "bg-blue-600/20 border-blue-500 text-blue-300"],
                  ["perks", "Perks Required", PERKS, "bg-green-600/20 border-green-500 text-green-300"],
                ] as const).map(([field, title, options, active]) => (
                  <div key={field}>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-3">{title}</label>
                    <div className="flex flex-wrap gap-2">
                      {options.map((opt) => (
                        <button type="button" key={opt} onClick={() => toggle(field, opt)} className={cn("px-4 py-2 rounded-lg text-sm border transition-colors", form[field].includes(opt) ? active : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10")}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-white/10">
                <ImageUpload label="Portrait photo (face)" purpose="profile_photo" value={form.portraitUrl} onChange={(url) => setForm({ ...form, portraitUrl: url })} />
                <ImageUpload label="Full look photo" purpose="profile_photo" value={form.fullLookUrl} onChange={(url) => setForm({ ...form, fullLookUrl: url })} />
                <p className="md:col-span-2 text-xs text-gray-500">Only admins and verified employers can see your photos. Camera location data is removed before upload.</p>
              </div>

              {error && <p role="alert" className="text-red-400 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</p>}

              <button onClick={handleSubmit} disabled={saving} className="w-full h-14 bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-60 rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2">
                <Send className="w-5 h-5" /> {saving ? "Saving…" : profile ? "Update & Resubmit for Verification" : "Submit Profile for Verification"}
              </button>
            </div>
          </div>
        )}

        {!loading && !needsLogin && activeTab === "gigs" && (
          <div className="space-y-8 max-w-4xl mx-auto">
            {error && <p role="alert" className="text-red-400 text-sm">{error}</p>}
            {applications.length > 0 && (
              <section>
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">My Applications</h2>
                <div className="space-y-2">
                  {applications.map((a) => (
                    <div key={a.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/10 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <Link href={`/nightlife/gigs/${a.gigId}`} className="font-bold hover:text-fuchsia-400 line-clamp-1">{a.gig?.title ?? "Gig"}</Link>
                        <div className="text-xs text-gray-500">{a.gig?.postedBy} · {a.gig?.eventDate}</div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-bold uppercase tracking-wider text-fuchsia-300">{a.status}</span>
                        {(a.status === "pending" || a.status === "shortlisted") && (
                          <button onClick={() => withdraw(a.id)} className="text-xs text-gray-400 hover:text-red-400 underline">Withdraw</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="space-y-4">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Open Gigs</h2>
              {board.length === 0 && <p className="text-center text-gray-500 py-12">No open gigs right now. Check back soon.</p>}
              {board.map((gig) => (
                <div key={gig.id} className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col md:flex-row justify-between gap-6">
                  <div>
                    <h3 className="text-xl font-bold mb-2">{gig.title}</h3>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-4">
                      <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-fuchsia-500" /> {gig.venueAddress}</span>
                      <span className="text-green-400 font-bold">₹{gig.payAmount.toLocaleString("en-IN")} ({gig.payCycle})</span>
                      <span>Date: {gig.eventDate}</span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {gig.rolesNeeded.map((r) => <span key={r} className="px-2 py-1 rounded bg-white/5 text-xs text-gray-300">{r}</span>)}
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center">
                    <Link href={`/nightlife/gigs/${gig.id}`}>
                      <button className="h-12 px-8 bg-white/10 hover:bg-fuchsia-600 font-bold rounded-xl transition-colors">
                        {appliedGigIds.has(gig.id) ? "Applied" : "View & Apply"}
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </section>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

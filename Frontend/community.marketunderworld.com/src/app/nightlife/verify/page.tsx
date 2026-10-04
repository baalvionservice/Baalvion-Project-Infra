"use client"

import { useCallback, useEffect, useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Check, X, ShieldAlert, Instagram } from "lucide-react";
import { nightAdmin, type Employer, type Profile } from "@/lib/api/gigs";
import { cn } from "@/lib/utils";

// Access is enforced by the API: every call below needs a platform-admin session and a
// non-admin simply gets a 403 message here.
export default function VerifyDashboard() {
  const [tab, setTab] = useState<"candidates" | "employers">("candidates");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setError("");
      const [p, e] = await Promise.all([nightAdmin.profiles("pending"), nightAdmin.employers("pending")]);
      setProfiles(p);
      setEmployers(e);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the queue.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const decide = async (kind: "profile" | "employer", id: string, status: "verified" | "rejected") => {
    let note: string | undefined;
    if (status === "rejected") {
      note = window.prompt("Reason for rejection (shown to the applicant):")?.trim();
      if (!note) return;
    }
    try {
      if (kind === "profile") await nightAdmin.reviewProfile(id, status, note);
      else await nightAdmin.reviewEmployer(id, status, note);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the decision.");
    }
  };

  const Actions = ({ kind, id }: { kind: "profile" | "employer"; id: string }) => (
    <div className="flex items-center gap-3">
      <button onClick={() => decide(kind, id, "rejected")} className="px-6 py-2 rounded-lg font-bold text-sm bg-white/5 hover:bg-red-500/20 hover:text-red-400 transition-colors flex items-center gap-2">
        <X className="w-4 h-4" /> Reject
      </button>
      <button onClick={() => decide(kind, id, "verified")} className="px-6 py-2 rounded-lg font-bold text-sm bg-green-500 hover:bg-green-400 text-black transition-colors flex items-center gap-2">
        <Check className="w-4 h-4" /> Approve
      </button>
    </div>
  );

  const pending = tab === "candidates" ? profiles.length : employers.length;

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      <Navbar />
      <main className="container max-w-5xl mx-auto px-6 pt-32 pb-24">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black flex items-center gap-3"><ShieldAlert className="w-8 h-8 text-red-500" /> Verification Queue</h1>
            <p className="text-gray-400 mt-2">Check the Instagram account behind each submission before approving.</p>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-xl font-bold">{pending} Pending</div>
        </div>

        <div className="flex bg-white/5 p-1 rounded-xl w-fit mb-8">
          {(["candidates", "employers"] as const).map((k) => (
            <button key={k} onClick={() => setTab(k)} className={cn("px-6 py-2.5 rounded-lg font-bold text-sm capitalize transition-colors", tab === k ? "bg-fuchsia-600" : "text-gray-400 hover:text-white")}>
              {k} ({k === "candidates" ? profiles.length : employers.length})
            </button>
          ))}
        </div>

        {error && <p role="alert" className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}
        {loading && <p className="text-center text-gray-500 py-20">Loading…</p>}
        {!loading && !error && pending === 0 && (
          <div className="text-center py-20 bg-white/[0.02] border border-white/10 rounded-2xl"><p className="text-gray-500">All caught up. Nothing is waiting for review.</p></div>
        )}

        <div className="space-y-6">
          {tab === "candidates" && profiles.map((c) => (
            <div key={c.id} className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-40 shrink-0 space-y-3">
                {[c.portraitUrl, c.fullLookUrl].map((url, i) => (
                  <div key={i} className="aspect-[3/4] bg-white/5 rounded-xl border border-white/10 overflow-hidden flex items-center justify-center text-xs text-gray-500">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {url ? <img src={url} alt={i ? "Full look" : "Portrait"} className="w-full h-full object-cover" /> : i ? "No full-look link" : "No portrait link"}
                  </div>
                ))}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold">{c.fullName}</h2>
                    <div className="text-gray-400 text-sm mt-1">{c.gender} • {c.age} yrs{c.height ? ` • ${c.height}` : ""} • {c.zone}</div>
                    <div className="text-gray-400 text-sm">WhatsApp: {c.whatsapp}</div>
                  </div>
                  <div className="text-xs text-gray-500">Submitted {new Date(c.createdAt).toLocaleDateString("en-IN")}</div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div><div className="text-xs font-bold text-gray-500 uppercase mb-1">Roles</div><div className="text-sm text-gray-300">{c.roles.join(", ")}</div></div>
                  <div><div className="text-xs font-bold text-gray-500 uppercase mb-1">Services</div><div className="text-sm text-gray-300">{c.services.join(", ") || "—"}</div></div>
                </div>
                <div className="flex items-center gap-4 border-t border-white/10 pt-6">
                  <a href={`https://instagram.com/${c.instagram}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-fuchsia-400 hover:text-fuchsia-300 text-sm font-bold bg-fuchsia-500/10 px-4 py-2 rounded-lg"><Instagram className="w-4 h-4" /> Check Instagram</a>
                  <div className="flex-1" />
                  <Actions kind="profile" id={c.id} />
                </div>
              </div>
            </div>
          ))}

          {tab === "employers" && employers.map((e) => (
            <div key={e.id} className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold">{e.businessName}</h2>
                  <div className="text-gray-400 text-sm mt-1">{e.contactName} • {e.phone} • {e.city}</div>
                </div>
                <div className="text-xs text-gray-500">Submitted {new Date(e.createdAt).toLocaleDateString("en-IN")}</div>
              </div>
              <div className="flex items-center gap-4 border-t border-white/10 pt-6">
                {e.website && <a href={e.website} target="_blank" rel="noreferrer" className="text-blue-400 text-sm underline">{e.website}</a>}
                {e.instagram && <a href={`https://instagram.com/${e.instagram}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-fuchsia-400 text-sm font-bold"><Instagram className="w-4 h-4" /> @{e.instagram}</a>}
                <div className="flex-1" />
                <Actions kind="employer" id={e.id} />
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { kycAdmin, type KycCase, type KycStatus } from "@/lib/api/kyc";

const box = "bg-white rounded-xl shadow-sm border border-gray-100";
const msg = (e: unknown, f: string) => {
  if (e instanceof Error && /platform admin required/i.test(e.message)) return "Only super admins can review identity documents. Ask a super admin to handle this queue.";
  return e instanceof Error ? e.message : f;
};

function DocumentViewer({ id, kind, label }: { id: string; kind: "id" | "selfie"; label: string }) {
  const [doc, setDoc] = useState<{ url: string; type: string } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Opening a document is logged server-side, so it only happens on an explicit click.
  const open = async () => {
    setLoading(true);
    setError("");
    try { setDoc(await kycAdmin.documentUrl(id, kind)); } catch (e) { setError(msg(e, "Could not open the document")); } finally { setLoading(false); }
  };
  useEffect(() => () => { if (doc) URL.revokeObjectURL(doc.url); }, [doc]);

  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-gray-500 uppercase">{label}</div>
      {!doc ? (
        <button onClick={open} disabled={loading} className="px-3 py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50 disabled:opacity-60">{loading ? "Opening…" : "Open (logged)"}</button>
      ) : doc.type === "application/pdf" ? (
        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-sm">Open PDF</a>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={doc.url} alt={label} className="max-h-72 rounded-lg border border-gray-200" />
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export default function AdminKycPage() {
  const [filter, setFilter] = useState<KycStatus>("submitted");
  const [cases, setCases] = useState<KycCase[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try { setError(""); setCases(await kycAdmin.list(filter)); } catch (e) { setError(msg(e, "Could not load cases")); } finally { setLoading(false); }
  }, [filter]);
  useEffect(() => { setLoading(true); load(); }, [load]);

  const decide = async (c: KycCase, status: "approved" | "rejected") => {
    let reason: string | undefined;
    if (status === "rejected") {
      reason = window.prompt("Reason for rejecting (shown to the applicant):")?.trim();
      if (!reason) return;
    } else if (!confirm(`Approve ${c.fullName}? Check the ID matches the selfie and the details below first.`)) return;
    try { await kycAdmin.decide(c.id, status, reason); await load(); } catch (e) { setError(msg(e, "Could not save the decision")); }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Identity verification</h1>
        <p className="text-gray-500 mt-2">Compare the ID with the selfie, and the name and date of birth with what the person entered. Every document you open is logged against your account.</p>
      </div>
      <div className="flex gap-2 flex-wrap">
        {(["submitted", "approved", "rejected", "expired"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-sm capitalize border ${filter === f ? "bg-fuchsia-600 text-white border-fuchsia-600" : "bg-white border-gray-200 text-gray-600"}`}>{f === "submitted" ? "Waiting" : f}</button>
        ))}
      </div>
      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {loading && <p className="text-gray-400">Loading…</p>}
      {!loading && cases.length === 0 && <p className={`${box} p-8 text-center text-gray-400 text-sm`}>No cases.</p>}
      {cases.map((c) => (
        <div key={c.id} className={`${box} p-5 space-y-4`}>
          <div className="flex flex-wrap justify-between gap-2">
            <div>
              <div className="font-semibold text-lg">{c.fullName}</div>
              <div className="text-sm text-gray-500">{c.nationality} · born {c.dateOfBirth} · {c.idType.replace("_", " ")} ending {c.idNumberLast4}</div>
              <div className="text-xs text-gray-400">{c.label ?? c.userId} · submitted {new Date(c.submittedAt).toLocaleString("en-IN")}{c.expiresAt ? ` · valid until ${new Date(c.expiresAt).toLocaleDateString("en-IN")}` : ""}</div>
            </div>
            <span className="px-2 py-1 h-fit rounded-md text-xs font-semibold uppercase bg-gray-100">{c.status}</span>
          </div>
          {c.status === "submitted" && !c.documentsPurged && (
            <div className="grid md:grid-cols-2 gap-6">
              <DocumentViewer id={c.id} kind="id" label="ID document" />
              <DocumentViewer id={c.id} kind="selfie" label="Selfie" />
            </div>
          )}
          {c.documentsPurged && <p className="text-xs text-gray-400">Documents were deleted after the retention period.</p>}
          {c.rejectionReason && <p className="text-sm text-gray-600">Reason given: {c.rejectionReason}</p>}
          {c.status === "submitted" && (
            <div className="flex gap-2">
              <button onClick={() => decide(c, "approved")} className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium">Approve</button>
              <button onClick={() => decide(c, "rejected")} className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50">Reject</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
